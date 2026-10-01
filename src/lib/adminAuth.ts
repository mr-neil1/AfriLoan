import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export type AdminAuthResult = {
  admin: any | null;
  errorResponse: NextResponse | null;
};

/**
 * Authenticates an admin request via JWT and verifies ADMIN privileges.
 */
export async function requireAdmin(req: Request): Promise<AdminAuthResult> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        admin: null,
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
        errorResponse: NextResponse.json(
          { error: "Compte administrateur introuvable." },
          { status: 404 }
        )
      };
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@afriloan.com";
    const isSuperAdmin = user.email.toLowerCase() === adminEmail.toLowerCase();
    const isAdminRole = user.role === "ADMIN";

    if (!isAdminRole && !isSuperAdmin) {
      return {
        admin: null,
        errorResponse: NextResponse.json(
          { error: "Accès interdit. Privilèges administrateur AfriLoan requis." },
          { status: 403 }
        )
      };
    }

    // Auto-promote configured admin email if not already ADMIN
    if (isSuperAdmin && user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" }
      });
      user.role = "ADMIN";
    }

    return {
      admin: user,
      errorResponse: null
    };
  } catch (error) {
    console.error("Admin Auth Error:", error);
    return {
      admin: null,
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
