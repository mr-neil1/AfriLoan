import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { googleAccessToken } = await req.json();

    if (!googleAccessToken) {
      return NextResponse.json({ error: "Token Google manquant." }, { status: 400 });
    }

    const googleRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${googleAccessToken}` },
    });

    if (!googleRes.ok) {
      return NextResponse.json({ error: "Jeton Google invalide ou expiré." }, { status: 401 });
    }

    const payload = await googleRes.json();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Impossible de récupérer l'email Google." }, { status: 400 });
    }

    const { email, name } = payload;
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      const newReferralCode = `AFRI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      user = await prisma.user.create({
        data: {
          name: name || "Utilisateur Google",
          email: email.toLowerCase().trim(),
          authProvider: "GOOGLE",
          isVerified: true,
          creditLimit: 150000,
          availableCredit: 150000,
          creditScore: 720,
          referralCode: newReferralCode,
        },
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "Bienvenue sur AfriLoan ! 🚀",
          message: "Votre compte a été créé avec Google. Votre crédit initial disponible est de 150 000 FCFA.",
          type: "SYSTEM",
        },
      });
    } else {
      if (!user.isVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true, authProvider: "GOOGLE" }
        });
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "365d" }
    );

    return NextResponse.json({
      message: "Connexion Google réussie.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
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
    console.error("Google Auth Error:", error);
    return NextResponse.json({ error: "Une erreur est survenue lors de l'authentification Google." }, { status: 500 });
  }
}
