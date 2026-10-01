import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email et code OTP requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json({ error: "Le compte est déjà vérifié." }, { status: 400 });
    }

    if (user.otpCode !== otp) {
      return NextResponse.json({ error: "Code de sécurité incorrect." }, { status: 400 });
    }

    if (user.otpExpiry && user.otpExpiry < new Date()) {
      return NextResponse.json({ error: "Le code de sécurité a expiré." }, { status: 400 });
    }

    await prisma.user.update({
      where: { email: user.email },
      data: {
        isVerified: true,
        otpCode: null,
        otpExpiry: null,
      },
    });

    return NextResponse.json({ message: "Compte vérifié avec succès." }, { status: 200 });
  } catch (error) {
    console.error("AfriLoan Verify Error:", error);
    return NextResponse.json({ error: "Une erreur est survenue lors de la vérification." }, { status: 500 });
  }
}
