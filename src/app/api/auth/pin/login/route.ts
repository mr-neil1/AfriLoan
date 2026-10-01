import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, pin } = await req.json();

    if (!email || !pin) {
      return NextResponse.json({ error: "Email et code PIN requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    if (!user.pinCodeHash) {
      return NextResponse.json({ error: "Code PIN non configuré. Veuillez vous connecter avec votre mot de passe." }, { status: 400 });
    }

    const pinMatch = await bcrypt.compare(pin, user.pinCodeHash);

    if (!pinMatch) {
      return NextResponse.json({ error: "Code PIN incorrect." }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "365d" }
    );

    return NextResponse.json({
      message: "Connexion réussie.",
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
      }
    }, { status: 200 });

  } catch (error) {
    console.error("PIN Login Error:", error);
    return NextResponse.json({ error: "Une erreur est survenue lors de la connexion par PIN." }, { status: 500 });
  }
}
