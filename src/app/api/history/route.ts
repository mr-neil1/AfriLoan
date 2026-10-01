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

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "90");
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        transactions: {
          where: { createdAt: { gte: dateLimit } },
          orderBy: { createdAt: "desc" }
        },
        repayments: {
          where: { createdAt: { gte: dateLimit } },
          orderBy: { createdAt: "desc" },
          include: { loan: true }
        },
        activities: {
          where: { createdAt: { gte: dateLimit } },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const historyRaw = [
      ...user.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || t.type,
        date: t.createdAt,
        status: t.status,
        category: "TRANSACTION"
      })),
      ...user.repayments.map(r => ({
        id: r.id,
        type: "REPAYMENT",
        amount: r.amount,
        description: `Remboursement ${r.loan?.title || "Prêt"} via ${r.paymentMethod}`,
        date: r.createdAt,
        status: r.status,
        category: "REPAYMENT"
      })),
      ...user.activities.map(a => ({
        id: a.id,
        type: a.type,
        amount: null,
        description: a.description,
        date: a.createdAt,
        status: "INFO",
        category: "ACTIVITY"
      }))
    ];

    // Remove duplicates if transaction matches repayment
    const history = historyRaw.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ history }, { status: 200 });
  } catch (error) {
    console.error("GET /api/history Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
