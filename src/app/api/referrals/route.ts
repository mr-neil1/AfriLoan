import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        referrals: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            loans: {
              where: { status: { in: ["ACTIVE", "DISBURSED"] } },
              select: { id: true, amount: true }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const referrals = user.referrals.map(ref => ({
      ...ref,
      isActive: ref.loans.length > 0,
      activeLoansCount: ref.loans.length
    }));

    return NextResponse.json({
      referralCode: user.referralCode,
      commission: user.commission,
      commissionBalance: user.commissionBalance,
      currency: user.currency,
      referrals
    });

  } catch (error) {
    console.error("GET /api/referrals Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
