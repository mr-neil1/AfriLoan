import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }
    if (!user.passwordHash) {
      return NextResponse.json({ error: "Ce compte utilise Google. Veuillez vous connecter avec Google." }, { status: 401 });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    if (!user.isVerified) {
      return NextResponse.json({ error: "Veuillez valider votre code de sécurité envoyé par email.", requiresVerification: true, userId: user.id }, { status: 403 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@afriloan.com";
    if (user.email.toLowerCase() === adminEmail.toLowerCase() && user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" }
      });
      user.role = "ADMIN";
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "afriloan_fallback_secret",
      { expiresIn: "365d" }
    );

    return NextResponse.json({
      message: "Connexion réussie.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        creditLimit: user.creditLimit,
        availableCredit: user.availableCredit,
        creditScore: user.creditScore,
        mobileMoneyProvider: user.mobileMoneyProvider,
        mobileMoneyNumber: user.mobileMoneyNumber
      },
      hasPin: !!user.pinCodeHash
    }, { status: 200 });

  } catch (error) {
    console.error("AfriLoan Login Error:", error);
    return NextResponse.json({ error: "Erreur lors de la connexion." }, { status: 500 });
  }
}
