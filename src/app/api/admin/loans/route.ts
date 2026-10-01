import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, verifyAdminPin } from "@/lib/adminAuth";
import { syncUserLoans } from "@/lib/loans";
import { sendLoanNotification } from "@/lib/mailer";

export async function GET(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const url = new URL(req.url);
    const status = url.searchParams.get("status");

    const whereClause: any = {};
    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, creditScore: true, creditLimit: true }
        },
        package: true,
        installments: {
          orderBy: { installmentNumber: "asc" }
        },
        repayments: {
          orderBy: { createdAt: "desc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ loans }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/loans Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { 
      loanId, 
      status, 
      fundVerificationStatus, 
      customerServiceContacted, 
      adminApprovalNotes, 
      pin 
    } = body;

    if (!loanId) {
      return NextResponse.json({ error: "ID du prêt requis." }, { status: 400 });
    }

    // Check PIN for sensitive actions
    if (status && ["DISBURSED", "REJECTED"].includes(status)) {
      const isPinValid = await verifyAdminPin(admin, pin || "0000");
      if (!isPinValid) {
        return NextResponse.json({ error: "Code PIN administrateur incorrect." }, { status: 403 });
      }
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { user: true }
    });

    if (!loan) {
      return NextResponse.json({ error: "Prêt introuvable." }, { status: 404 });
    }

    const updateData: any = {};
    if (status) {
      updateData.status = status;
      if (status === "DISBURSED") {
        updateData.disbursedAt = new Date();
      }
    }
    if (fundVerificationStatus !== undefined) {
      updateData.fundVerificationStatus = fundVerificationStatus;
    }
    if (customerServiceContacted !== undefined) {
      updateData.customerServiceContacted = customerServiceContacted;
    }
    if (adminApprovalNotes !== undefined) {
      updateData.adminApprovalNotes = adminApprovalNotes;
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: updateData
    });

    // Si déboursement validé, enregistrer la transaction
    if (status === "DISBURSED" && loan.status !== "DISBURSED") {
      const ref = `DISB-${loan.id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      await prisma.transaction.create({
        data: {
          userId: loan.userId,
          amount: loan.amount,
          type: "LOAN_DISBURSEMENT",
          status: "COMPLETED",
          reference: ref,
          paymentMethod: (loan as any).disbursementMethod || "ORANGE_MONEY",
          phoneNumber: loan.disbursementPhone || loan.user.phone,
          description: `Déboursement ${loan.title} vers ${(loan as any).disbursementMethod || "Mobile Money"} (${loan.disbursementPhone})`
        }
      });

      await prisma.activity.create({
        data: {
          userId: loan.userId,
          type: "LOAN_DISBURSED",
          description: `Prêt de ${loan.amount.toLocaleString("fr-FR")} FCFA validé et déboursé par l'administration.`
        }
      });
    }

    // Notifications
    if (status) {
      let notifTitle = "Mise à jour de votre prêt";
      let notifMsg = `Le statut de votre prêt ${loan.title} est désormais : ${status}.`;

      if (status === "APPROVED" || status === "DISBURSED") {
        notifTitle = "✅ Prêt validé & déboursé";
        notifMsg = `Votre prêt de ${loan.amount.toLocaleString("fr-FR")} FCFA a été validé et déboursé sur votre compte Mobile Money (${(loan as any).disbursementMethod || "Mobile Money"}).`;
      } else if (status === "REJECTED") {
        notifTitle = "Demande de prêt non approuvée";
        notifMsg = `Votre demande de prêt pour ${loan.title} n'a pas pu être acceptée. Motif: ${adminApprovalNotes || "Solde de garantie non confirmé ou profil non conforme"}.`;
      }

      await prisma.notification.create({
        data: {
          userId: loan.userId,
          title: notifTitle,
          message: notifMsg,
          type: status === "DISBURSED" ? "LOAN_DISBURSED" : "SYSTEM",
          link: "/app/loans"
        }
      });

      await sendLoanNotification(loan.user.email, notifTitle, notifMsg, loan.amount);
      await syncUserLoans(loan.userId);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Dossier de prêt mis à jour avec succès.",
      loan: updatedLoan 
    }, { status: 200 });

  } catch (error) {
    console.error("PUT /api/admin/loans Error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du prêt." }, { status: 500 });
  }
}
