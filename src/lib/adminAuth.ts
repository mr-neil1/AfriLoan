import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export type AdminAuthResult = {
  admin: any | null;
  isSuperAdmin: boolean;
  clientScopeFilter: any;
  errorResponse: NextResponse | null;
};

/**
 * Checks if a user is the primary Super Admin.
 */
export function isUserSuperAdmin(user: any): boolean {
  if (!user) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "samyneil4@gmail.com";
  return (
    user.role === "SUPER_ADMIN" ||
    (user.email && user.email.toLowerCase() === adminEmail.toLowerCase())
  );
}

/**
 * Authenticates an admin request via JWT and verifies ADMIN or SUPER_ADMIN privileges.
 * Scopes data according to whether the user is Super Admin (sees everything)
 * or Sub-Admin (sees only their assigned clients).
 */
export async function requireAdmin(
  req: Request, 
  options?: { superAdminOnly?: boolean }
): Promise<AdminAuthResult> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        admin: null,
        isSuperAdmin: false,
        clientScopeFilter: {},
        errorResponse: NextResponse.json(
          { error: "Accès refusé. Jeton d'authentification manquant." },
          { status: 401 }
        )
      };
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    } catch (e) {
      return {
        admin: null,
        isSuperAdmin: false,
        clientScopeFilter: {},
        errorResponse: NextResponse.json(
          { error: "Session expirée ou invalide. Veuillez vous reconnecter." },
          { status: 401 }
        )
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return {
        admin: null,
        isSuperAdmin: false,
        clientScopeFilter: {},
        errorResponse: NextResponse.json(
          { error: "Compte administrateur introuvable." },
          { status: 404 }
        )
      };
    }

    const isSuperAdmin = isUserSuperAdmin(user);
    const isAdminRole = user.role === "ADMIN" || user.role === "SUPER_ADMIN";

    if (!isAdminRole && !isSuperAdmin) {
      return {
        admin: null,
        isSuperAdmin: false,
        clientScopeFilter: {},
        errorResponse: NextResponse.json(
          { error: "Accès interdit. Privilèges administrateur AfriLoan requis." },
          { status: 403 }
        )
      };
    }

    // Check if sub-admin account has been suspended
    if (!isSuperAdmin && user.adminStatus === "SUSPENDED") {
      return {
        admin: null,
        isSuperAdmin: false,
        clientScopeFilter: {},
        errorResponse: NextResponse.json(
          { error: "Votre compte administrateur a été suspendu par l'administrateur principal." },
          { status: 403 }
        )
      };
    }

    // Auto-promote configured main admin email to SUPER_ADMIN if needed
    if (isSuperAdmin && user.role !== "SUPER_ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          role: "SUPER_ADMIN",
          adminCode: user.adminCode || "PRINCIPAL"
        }
      });
      user.role = "SUPER_ADMIN";
      user.adminCode = user.adminCode || "PRINCIPAL";
    }

    // Super Admin Only gate
    if (options?.superAdminOnly && !isSuperAdmin) {
      return {
        admin: user,
        isSuperAdmin: false,
        clientScopeFilter: { assignedAdminId: user.id },
        errorResponse: NextResponse.json(
          { error: "Action réservée à l'administrateur principal AfriLoan." },
          { status: 403 }
        )
      };
    }

    // Sub-admins only see users assigned to them
    const clientScopeFilter = isSuperAdmin ? {} : { assignedAdminId: user.id };

    return {
      admin: user,
      isSuperAdmin,
      clientScopeFilter,
      errorResponse: null
    };
  } catch (error) {
    console.error("Admin Auth Error:", error);
    return {
      admin: null,
      isSuperAdmin: false,
      clientScopeFilter: {},
      errorResponse: NextResponse.json(
        { error: "Erreur serveur lors de la vérification des droits administrateur." },
        { status: 500 }
      )
    };
  }
}

/**
 * Validates the admin's PIN code for sensitive loan or financial operations.
 */
export async function verifyAdminPin(adminUser: any, pin: string): Promise<boolean> {
  if (!pin || typeof pin !== "string") {
    return false;
  }

  const cleanPin = pin.trim();
  if (cleanPin.length < 4) {
    return false;
  }

  if (adminUser.pinCodeHash) {
    const isMatch = await bcrypt.compare(cleanPin, adminUser.pinCodeHash);
    if (isMatch) return true;
  }

  if (!adminUser.pinCodeHash) {
    if (cleanPin === "0000") return true;
  }

  return false;
}
