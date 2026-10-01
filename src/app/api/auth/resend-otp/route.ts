import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendOTP } from "@/lib/mailer";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode,
        otpExpiry,
      },
    });

    await sendOTP(user.email, otpCode);

    return NextResponse.json({ message: "Nouveau code envoyé avec succès." }, { status: 200 });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return NextResponse.json({ error: "Erreur lors du renvoi du code." }, { status: 500 });
  }
}
