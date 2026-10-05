import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, isUserSuperAdmin } from "@/lib/adminAuth";
import jwt from "jsonwebtoken";

const DEFAULT_GLOBAL_PHONE = "+2250700000000";

function formatWhatsAppUrl(phone: string, message?: string): string {
  const clean = phone.replace(/[^0-9]/g, "");
  const base = `https://wa.me/${clean}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }
  return base;
}

// GET: Returns the appropriate customer service contact (assigned admin vs global)
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const mode = url.searchParams.get("mode");
    const agentCodeParam = url.searchParams.get("agent") || url.searchParams.get("ref");
    const authHeader = req.headers.get("authorization");

    // Mode admin: Return current configuration for settings screens
    if (mode === "admin" || mode === "settings") {
      const { admin, isSuperAdmin, errorResponse } = await requireAdmin(req);
      if (errorResponse) return errorResponse;

      const [globalPhoneSetting, globalLinkSetting] = await Promise.all([
        prisma.systemSetting.findUnique({ where: { key: "global_support_phone" } }),
        prisma.systemSetting.findUnique({ where: { key: "global_support_whatsapp_link" } })
      ]);

      const globalPhone = globalPhoneSetting?.value || DEFAULT_GLOBAL_PHONE;
      const globalWhatsappUrl = globalLinkSetting?.value || formatWhatsAppUrl(globalPhone);

      return NextResponse.json({
        isSuperAdmin,
        admin: {
          id: admin.id,
          name: admin.name,
          adminCode: admin.adminCode,
          phone: admin.phone,
          supportPhone: admin.supportPhone,
          supportWhatsappLink: admin.supportWhatsappLink
        },
        global: {
          phone: globalPhone,
          whatsappUrl: globalWhatsappUrl
        }
      }, { status: 200 });
    }

    let assignedAdmin: any = null;

    // 1. If user is logged in, check their assigned admin
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            id: true,
            name: true,
            assignedAdmin: {
              select: {
                id: true,
                name: true,
                adminCode: true,
                phone: true,
                supportPhone: true,
                supportWhatsappLink: true
              }
            }
          }
        });

        if (user?.assignedAdmin) {
          assignedAdmin = user.assignedAdmin;
        }
      } catch (e) {
        // Token invalid or expired, continue to fallback
      }
    }

    // 2. If not logged in, but visitor has an agent reference in URL
    if (!assignedAdmin && agentCodeParam) {
      const adminByCode = await prisma.user.findFirst({
        where: {
          adminCode: { equals: agentCodeParam.trim(), mode: "insensitive" },
          role: { in: ["ADMIN", "SUPER_ADMIN"] }
        },
        select: {
          id: true,
          name: true,
          adminCode: true,
          phone: true,
          supportPhone: true,
          supportWhatsappLink: true
        }
      });
      if (adminByCode) {
        assignedAdmin = adminByCode;
      }
    }

    // 3. If an assigned admin was found and has a configured support number
    const adminPhone = assignedAdmin?.supportPhone || assignedAdmin?.phone;
    if (assignedAdmin && adminPhone) {
      const whatsappUrl = assignedAdmin.supportWhatsappLink || formatWhatsAppUrl(adminPhone);
      return NextResponse.json({
        isDedicatedAgent: true,
        agentName: assignedAdmin.name,
        agentCode: assignedAdmin.adminCode,
        phone: adminPhone,
        whatsappUrl,
        formattedPhone: adminPhone
      }, { status: 200 });
    }

    // 4. Fallback: Global Customer Service set by Super Admin
    const [globalPhoneSetting, globalLinkSetting] = await Promise.all([
      prisma.systemSetting.findUnique({ where: { key: "global_support_phone" } }),
      prisma.systemSetting.findUnique({ where: { key: "global_support_whatsapp_link" } })
    ]);

    const globalPhone = globalPhoneSetting?.value || DEFAULT_GLOBAL_PHONE;
    const globalWhatsappUrl = globalLinkSetting?.value || formatWhatsAppUrl(globalPhone);

    return NextResponse.json({
      isDedicatedAgent: false,
      agentName: "Service Client AfriLoan",
      agentCode: "PRINCIPAL",
      phone: globalPhone,
      whatsappUrl: globalWhatsappUrl,
      formattedPhone: globalPhone
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/support Error:", error);
    return NextResponse.json({
      isDedicatedAgent: false,
      agentName: "Service Client AfriLoan",
      phone: DEFAULT_GLOBAL_PHONE,
      whatsappUrl: `https://wa.me/2250700000000`,
      formattedPhone: DEFAULT_GLOBAL_PHONE
    }, { status: 200 });
  }
}

// PUT: Updates customer service link / phone (Super Admin vs Sub-Admin)
export async function PUT(req: Request) {
  try {
    const { admin, isSuperAdmin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { 
      supportPhone, 
      supportWhatsappLink, 
      targetAdminId, 
      isGlobal 
    } = body;

    // Rule: Only Super Admin can modify Global Customer Service
    if (isGlobal) {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Seul l'administrateur principal est autorisé à modifier le service client global." },
          { status: 403 }
        );
      }

      if (supportPhone) {
        await prisma.systemSetting.upsert({
          where: { key: "global_support_phone" },
          update: { value: supportPhone.trim() },
          create: { key: "global_support_phone", value: supportPhone.trim(), description: "Numéro service client global" }
        });
      }

      if (supportWhatsappLink !== undefined) {
        await prisma.systemSetting.upsert({
          where: { key: "global_support_whatsapp_link" },
          update: { value: supportWhatsappLink ? supportWhatsappLink.trim() : formatWhatsAppUrl(supportPhone || DEFAULT_GLOBAL_PHONE) },
          create: { key: "global_support_whatsapp_link", value: supportWhatsappLink ? supportWhatsappLink.trim() : formatWhatsAppUrl(supportPhone || DEFAULT_GLOBAL_PHONE) }
        });
      }

      return NextResponse.json({
        message: "Service client global mis à jour avec succès !",
        globalSupportPhone: supportPhone,
        globalSupportWhatsappLink: supportWhatsappLink
      }, { status: 200 });
    }

    // Sub-admin or Super Admin modifying an admin's specific customer service
    let effectiveAdminId = admin.id;

    if (targetAdminId && targetAdminId !== admin.id) {
      if (!isSuperAdmin) {
        return NextResponse.json(
          { error: "Vous n'êtes autorisé à modifier que votre propre service client." },
          { status: 403 }
        );
      }
      effectiveAdminId = targetAdminId;
    }

    const cleanPhone = (supportPhone || "").trim();
    const cleanLink = supportWhatsappLink ? supportWhatsappLink.trim() : (cleanPhone ? formatWhatsAppUrl(cleanPhone) : null);

    const updatedAdmin = await prisma.user.update({
      where: { id: effectiveAdminId },
      data: {
        supportPhone: cleanPhone || null,
        supportWhatsappLink: cleanLink
      },
      select: {
        id: true,
        name: true,
        adminCode: true,
        supportPhone: true,
        supportWhatsappLink: true
      }
    });

    return NextResponse.json({
      message: "Numéro de service client de votre portefeuille mis à jour avec succès !",
      admin: updatedAdmin
    }, { status: 200 });

  } catch (error: any) {
    console.error("PUT /api/support Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour du service client." },
      { status: 500 }
    );
  }
}
