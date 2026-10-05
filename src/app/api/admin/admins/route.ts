import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import bcrypt from "bcryptjs";

// GET: Super Admin lists all administrators and their client stats
export async function GET(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req, { superAdminOnly: true });
    if (errorResponse) return errorResponse;

    const admins = await prisma.user.findMany({
      where: {
        role: { in: ["ADMIN", "SUPER_ADMIN"] }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        adminCode: true,
        adminStatus: true,
        createdAt: true,
        _count: {
          select: { managedClients: true }
        },
        managedClients: {
          select: {
            id: true,
            loans: {
              select: {
                amount: true,
                totalToRepay: true,
                repaidAmount: true,
                status: true
              }
            }
          }
        }
      }
    });

    // Compute volume metrics per admin
    const adminsWithStats = admins.map((adm) => {
      let totalDisbursed = 0;
      let totalRepaid = 0;
      let activeLoansCount = 0;

      for (const client of adm.managedClients) {
        for (const loan of client.loans) {
          if (["ACTIVE", "DISBURSED", "REPAID", "OVERDUE"].includes(loan.status)) {
            totalDisbursed += loan.amount;
          }
          if (["ACTIVE", "OVERDUE", "DISBURSED"].includes(loan.status)) {
            activeLoansCount++;
          }
          totalRepaid += loan.repaidAmount || 0;
        }
      }

      return {
        id: adm.id,
        name: adm.name,
        email: adm.email,
        phone: adm.phone,
        role: adm.role,
        adminCode: adm.adminCode || adm.id.slice(-6).toUpperCase(),
        adminStatus: adm.adminStatus || "ACTIVE",
        createdAt: adm.createdAt,
        clientCount: adm._count.managedClients,
        activeLoansCount,
        totalDisbursed,
        totalRepaid
      };
    });

    return NextResponse.json({ admins: adminsWithStats }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/admins Error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des administrateurs." },
      { status: 500 }
    );
  }
}

// POST: Super Admin creates a new Sub-Admin with custom code
export async function POST(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req, { superAdminOnly: true });
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, email, password, phone, adminCode } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Le nom, l'adresse e-mail et le mot de passe sont obligatoires." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit comporter au moins 6 caractères." },
        { status: 400 }
      );
    }

    // Check existing email
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (existing) {
      return NextResponse.json(
        { error: "Cette adresse e-mail est déjà utilisée par un autre compte." },
        { status: 400 }
      );
    }

    // Normalize and validate adminCode (or generate one)
    const cleanAdminCode = (adminCode || `AG-${Math.random().toString(36).substring(2, 7)}`)
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "");

    const existingCode = await prisma.user.findUnique({
      where: { adminCode: cleanAdminCode }
    });
    if (existingCode) {
      return NextResponse.json(
        { error: `Le code d'agent "${cleanAdminCode}" est déjà attribué. Veuillez en choisir un autre.` },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        phone: phone?.trim() || null,
        role: "ADMIN",
        adminCode: cleanAdminCode,
        adminStatus: "ACTIVE",
        isVerified: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        adminCode: true,
        adminStatus: true,
        createdAt: true
      }
    });

    return NextResponse.json(
      { 
        message: "Administrateur créé avec succès !",
        admin: newAdmin
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/admin/admins Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de l'administrateur." },
      { status: 500 }
    );
  }
}

// PUT: Super Admin updates or toggles status of a Sub-Admin
export async function PUT(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req, { superAdminOnly: true });
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { adminId, name, phone, adminCode, adminStatus, newPassword } = body;

    if (!adminId) {
      return NextResponse.json({ error: "ID de l'administrateur requis." }, { status: 400 });
    }

    const targetAdmin = await prisma.user.findUnique({
      where: { id: adminId }
    });
    if (!targetAdmin) {
      return NextResponse.json({ error: "Administrateur introuvable." }, { status: 404 });
    }

    // Protect Super Admin from being altered into normal admin or suspended
    if (targetAdmin.role === "SUPER_ADMIN" && adminStatus === "SUSPENDED") {
      return NextResponse.json(
        { error: "Impossible de suspendre l'administrateur principal." },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (adminStatus && ["ACTIVE", "SUSPENDED"].includes(adminStatus)) {
      updateData.adminStatus = adminStatus;
    }

    if (adminCode && adminCode.toUpperCase() !== targetAdmin.adminCode) {
      const cleanCode = adminCode.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
      const duplicate = await prisma.user.findUnique({ where: { adminCode: cleanCode } });
      if (duplicate && duplicate.id !== adminId) {
        return NextResponse.json(
          { error: `Le code "${cleanCode}" est déjà attribué.` },
          { status: 400 }
        );
      }
      updateData.adminCode = cleanCode;
    }

    if (newPassword && newPassword.length >= 6) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        adminCode: true,
        adminStatus: true
      }
    });

    return NextResponse.json(
      { message: "Administrateur mis à jour avec succès.", admin: updated },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("PUT /api/admin/admins Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la mise à jour de l'administrateur." },
      { status: 500 }
    );
  }
}

// DELETE: Super Admin deletes a Sub-Admin
export async function DELETE(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req, { superAdminOnly: true });
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get("id");

    if (!adminId) {
      return NextResponse.json({ error: "ID de l'administrateur requis." }, { status: 400 });
    }

    const targetAdmin = await prisma.user.findUnique({
      where: { id: adminId }
    });
    if (!targetAdmin) {
      return NextResponse.json({ error: "Administrateur introuvable." }, { status: 404 });
    }

    if (targetAdmin.role === "SUPER_ADMIN" || targetAdmin.id === admin.id) {
      return NextResponse.json(
        { error: "Impossible de supprimer l'administrateur principal." },
        { status: 400 }
      );
    }

    // Unassign clients to prevent orphan foreign key issues
    await prisma.user.updateMany({
      where: { assignedAdminId: adminId },
      data: { assignedAdminId: null }
    });

    await prisma.user.delete({
      where: { id: adminId }
    });

    return NextResponse.json(
      { message: "Administrateur supprimé et ses clients ont été réaffectés au niveau global." },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("DELETE /api/admin/admins Error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la suppression de l'administrateur." },
      { status: 500 }
    );
  }
}
