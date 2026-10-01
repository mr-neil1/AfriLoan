import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    } catch (e) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { pin } = await req.json();

    if (!pin || typeof pin !== "string" || pin.length !== 4) {
      return NextResponse.json({ error: "Le code PIN doit comporter 4 chiffres." }, { status: 400 });
    }

    const userId = decoded.userId;
    const pinCodeHash = await bcrypt.hash(pin, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { pinCodeHash }
    });

    return NextResponse.json({ message: "Code PIN configuré avec succès." }, { status: 200 });
  } catch (error) {
    console.error("PIN Setup Error:", error);
    return NextResponse.json({ error: "Erreur lors de la configuration du PIN." }, { status: 500 });
  }
}
