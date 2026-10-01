import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { syncUserLoans } from "@/lib/loans";
import { sendLoanNotification } from "@/lib/mailer";

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
      return NextResponse.json({ error: "Session expirée ou invalide" }, { status: 401 });
    }

    const userId = decoded.userId;
    const body = await req.json();
    const { loanId, amount, paymentMethod, phoneNumber, notes } = body;

    const repayAmount = Number(amount);
    if (!repayAmount || repayAmount <= 0) {
      return NextResponse.json({ error: "Montant de remboursement invalide." }, { status: 400 });
    }

    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId },
      include: {
        installments: {
          orderBy: { installmentNumber: "asc" }
        }
      }
    });

    if (!loan) {
      return NextResponse.json({ error: "Prêt introuvable." }, { status: 404 });
    }

    if (loan.status === "REPAID" || loan.remainingAmount <= 0) {
      return NextResponse.json({ error: "Ce prêt est déjà intégralement remboursé." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé." }, { status: 404 });
    }

    const effectiveMethod = paymentMethod || user.mobileMoneyProvider || "ORANGE_MONEY";
    const effectivePhone = phoneNumber || user.mobileMoneyNumber || user.phone || "";
    const reference = `REPAY-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Enregistrer le remboursement
    const repayment = await prisma.repayment.create({
      data: {
        loanId: loan.id,
        userId: user.id,
        amount: repayAmount,
        paymentMethod: effectiveMethod,
        phoneNumber: effectivePhone,
        reference,
        status: "COMPLETED",
        notes: notes || `Remboursement via ${effectiveMethod}`,
      }
    });

    // Mettre à jour le prêt et ses échéances
    const newRepaidAmount = loan.repaidAmount + repayAmount;
    const newRemainingAmount = Math.max(0, loan.totalToRepay - newRepaidAmount);
    const isFullyRepaid = newRemainingAmount === 0;

    // Répartir le montant payé sur les échéances
    let unallocatedPayment = repayAmount;
    let nextUpcomingDate: Date | null = null;
    let nextUpcomingAmount: number | null = null;

    for (const inst of loan.installments) {
      if (inst.status !== "PAID" && unallocatedPayment > 0) {
        const needed = inst.amount - inst.paidAmount;
        if (unallocatedPayment >= needed) {
          unallocatedPayment -= needed;
          await prisma.loanInstallment.update({
            where: { id: inst.id },
            data: {
              paidAmount: inst.amount,
              status: "PAID",
              paidAt: new Date()
            }
          });
        } else {
          await prisma.loanInstallment.update({
            where: { id: inst.id },
            data: {
              paidAmount: inst.paidAmount + unallocatedPayment
            }
          });
          unallocatedPayment = 0;
          nextUpcomingDate = new Date(inst.dueDate);
          nextUpcomingAmount = inst.amount - (inst.paidAmount + unallocatedPayment);
        }
      } else if (inst.status !== "PAID" && !nextUpcomingDate) {
        nextUpcomingDate = new Date(inst.dueDate);
        nextUpcomingAmount = inst.amount - inst.paidAmount;
      }
    }

    // Mettre à jour le statut du prêt
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        repaidAmount: newRepaidAmount,
        remainingAmount: newRemainingAmount,
        status: isFullyRepaid ? "REPAID" : "ACTIVE",
        nextDueDate: isFullyRepaid ? null : nextUpcomingDate,
        nextDueAmount: isFullyRepaid ? null : nextUpcomingAmount
      }
    });

    // Enregistrer la transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        amount: repayAmount,
        type: "LOAN_REPAYMENT",
        status: "COMPLETED",
        reference,
        paymentMethod: effectiveMethod,
        phoneNumber: effectivePhone,
        description: `Remboursement de ${repayAmount.toLocaleString("fr-FR")} FCFA pour ${loan.title}`
      }
    });

    // Activité
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "REPAYMENT",
        description: `Remboursement de ${repayAmount.toLocaleString("fr-FR")} FCFA effectué via ${effectiveMethod}.`
      }
    });

    // Si le prêt est intégralement remboursé, récompenser l'utilisateur
    if (isFullyRepaid) {
      const newCreditLimit = Math.round(user.creditLimit * 1.25); // +25% de capacité d'emprunt
      const newCreditScore = Math.min(950, user.creditScore + 30); // +30 points score

      await prisma.user.update({
        where: { id: user.id },
        data: {
          creditLimit: newCreditLimit,
          creditScore: newCreditScore,
        }
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "🏆 Prêt 100% remboursé !",
          message: `Félicitations ! Vous avez intégralement remboursé votre prêt. Votre plafond de crédit augmente à ${newCreditLimit.toLocaleString("fr-FR")} FCFA et votre score passe à ${newCreditScore}/1000.`,
          type: "REPAYMENT_SUCCESS",
          link: "/app/loans"
        }
      });
    } else {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: "✅ Remboursement enregistré",
          message: `Votre versement de ${repayAmount.toLocaleString("fr-FR")} FCFA a été validé. Reste à rembourser : ${newRemainingAmount.toLocaleString("fr-FR")} FCFA.`,
          type: "REPAYMENT_SUCCESS",
          link: "/app/loans"
        }
      });
    }

    await sendLoanNotification(
      user.email,
      "Reçu de remboursement AfriLoan",
      `Votre versement de ${repayAmount.toLocaleString("fr-FR")} FCFA via ${effectiveMethod} a été enregistré avec succès. Reste dû : ${newRemainingAmount.toLocaleString("fr-FR")} FCFA.`,
      repayAmount
    );

    await syncUserLoans(user.id);

    return NextResponse.json({
      success: true,
      message: isFullyRepaid ? "Félicitations ! Prêt intégralement remboursé." : "Remboursement effectué avec succès.",
      repayment,
      remainingAmount: newRemainingAmount,
      isFullyRepaid
    }, { status: 200 });

  } catch (error) {
    console.error("POST /api/repay Error:", error);
    return NextResponse.json({ error: "Erreur lors du traitement du remboursement." }, { status: 500 });
  }
}
