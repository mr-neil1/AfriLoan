import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { syncUserLoans } from "@/lib/loans";

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

    const userId = decoded.userId;

    // Synchroniser les statuts et alertes de prêts
    const loanSyncStats = await syncUserLoans(userId);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        loans: {
          include: {
            package: true,
            installments: {
              orderBy: { installmentNumber: "asc" }
            },
            repayments: {
              orderBy: { createdAt: "desc" },
              take: 5
            }
          },
          orderBy: { createdAt: "desc" }
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          take: 6
        },
        activities: {
          orderBy: { createdAt: "desc" },
          take: 6
        },
        notifications: {
          where: { isRead: false },
          orderBy: { createdAt: "desc" },
          take: 5
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const activeLoans = user.loans.filter(l => ["ACTIVE", "OVERDUE", "DISBURSED", "PENDING", "APPROVED"].includes(l.status));
    const completedLoans = user.loans.filter(l => l.status === "REPAID");

    // Prochaine échéance la plus proche
    let nextUpcomingDue: { date: Date | null; amount: number | null; loanTitle: string | null; loanId: string | null } = {
      date: null,
      amount: null,
      loanTitle: null,
      loanId: null
    };

    const now = new Date();
    for (const loan of activeLoans) {
      if (loan.status === "ACTIVE" || loan.status === "OVERDUE" || loan.status === "DISBURSED") {
        for (const inst of loan.installments) {
          if (inst.status === "PENDING") {
            const dueDate = new Date(inst.dueDate);
            if (!nextUpcomingDue.date || dueDate < nextUpcomingDue.date) {
              nextUpcomingDue = {
                date: dueDate,
                amount: inst.amount - inst.paidAmount,
                loanTitle: loan.title,
                loanId: loan.id
              };
            }
          }
        }
      }
    }

    // Calcul du total restant à rembourser
    const totalRemainingAmount = activeLoans.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0);

    // Merge transactions and activities for timeline
    const historyCombined = [
      ...user.transactions.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        description: t.description || t.type,
        date: t.createdAt,
        status: t.status,
        category: 'TRANSACTION'
      })),
      ...user.activities.map(a => ({
        id: a.id,
        type: a.type,
        amount: null,
        description: a.description,
        date: a.createdAt,
        status: 'INFO',
        category: 'ACTIVITY'
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

    // Chart data for loans & repayments evolution
    const chartData = [
      { name: "S1", borrowed: 0, repaid: 0 },
      { name: "S2", borrowed: Math.round(user.totalBorrowed * 0.3), repaid: Math.round(user.totalRepaid * 0.2) },
      { name: "S3", borrowed: Math.round(user.totalBorrowed * 0.6), repaid: Math.round(user.totalRepaid * 0.5) },
      { name: "S4", borrowed: Math.round(user.totalBorrowed * 0.8), repaid: Math.round(user.totalRepaid * 0.8) },
      { name: "Ce mois", borrowed: user.totalBorrowed, repaid: user.totalRepaid }
    ];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        currency: user.currency,
        language: user.language,
        creditLimit: user.creditLimit,
        availableCredit: user.availableCredit,
        creditScore: user.creditScore,
        totalBorrowed: user.totalBorrowed,
        totalRepaid: user.totalRepaid,
        totalRemainingAmount,
        walletBalance: user.walletBalance,
        mobileMoneyProvider: user.mobileMoneyProvider,
        mobileMoneyNumber: user.mobileMoneyNumber
      },
      stats: {
        activeLoansCount: activeLoans.length,
        completedLoansCount: completedLoans.length,
        totalBorrowed: user.totalBorrowed,
        totalRepaid: user.totalRepaid,
        totalRemainingAmount,
        availableCredit: user.availableCredit,
        creditScore: user.creditScore,
        nextUpcomingDue
      },
      activeLoans,
      completedLoans,
      recentHistory: historyCombined,
      notifications: user.notifications,
      chartData
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/dashboard Error:", error);
    return NextResponse.json({ error: "Erreur serveur lors du chargement du tableau de bord." }, { status: 500 });
  }
}
