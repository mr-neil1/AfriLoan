import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendOTP, sendLoanNotification } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { name, email, password, phone, mobileMoneyProvider, mobileMoneyNumber, referralCode } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Nom, e-mail et mot de passe sont requis." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Cet email est déjà associé à un compte AfriLoan." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    let referredById = null;
    if (referralCode && referralCode.trim() !== "") {
      const referrer = await prisma.user.findUnique({ where: { referralCode: referralCode.trim() } });
      if (referrer) {
        referredById = referrer.id;
      }
    }

    const newReferralCode = `AFRI-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        mobileMoneyProvider: mobileMoneyProvider || "ORANGE_MONEY",
        mobileMoneyNumber: mobileMoneyNumber || phone,
        otpCode,
        otpExpiry,
        isVerified: false,
        creditLimit: 150000,
        availableCredit: 150000,
        creditScore: 720,
        referralCode: newReferralCode,
        referredById,
      },
    });

    if (referredById) {
      await prisma.activity.create({
        data: {
          userId: referredById,
          type: "NEW_REFERRAL",
          description: `${name} a rejoint AfriLoan avec votre code de parrainage !`,
        },
      });
    }

    // Welcome notification
    await prisma.notification.create({
      data: {
        userId: newUser.id,
        title: "Bienvenue sur AfriLoan ! 🚀",
        message: "Votre compte a été créé. Vous disposez d'un crédit initial disponible de 150 000 FCFA.",
        type: "SYSTEM",
      },
    });

    await sendOTP(email, otpCode);

    return NextResponse.json(
      { message: "Compte créé avec succès. Vérifiez vos emails pour le code de sécurité.", userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("AfriLoan Register Error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la création du compte." }, { status: 500 });
  }
}
