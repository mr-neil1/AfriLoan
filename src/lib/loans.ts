import prisma from "@/lib/prisma";

export interface LoanTerms {
  amount: number;
  durationDays: number;
  interestRate: number;
  interestAmount: number;
  totalToRepay: number;
  installmentCount: number;
  installmentAmount: number;
  installments: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: Date;
  }>;
}

/**
 * Calculates interest, total to repay, and installment schedule.
 */
export function calculateLoanTerms(
  amount: number,
  durationDays: number,
  interestRateOverride?: number
): LoanTerms {
  // If no override, calculate competitive rate based on duration and amount
  let rate = interestRateOverride;
  if (!rate) {
    if (durationDays <= 15) rate = 5.0;
    else if (durationDays <= 30) rate = 7.5;
    else if (durationDays <= 60) rate = 9.0;
    else if (durationDays <= 90) rate = 11.0;
    else rate = 12.5;
  }

  const interestAmount = Math.round(amount * (rate / 100));
  const totalToRepay = amount + interestAmount;

  // Determine installments count:
  // <= 21 days: 1 installment
  // 30 days: 2 installments (every 15 days)
  // 45 - 60 days: 2 or 3 installments
  // 90+ days: 3 or 4 installments (monthly)
  let installmentCount = 1;
  if (durationDays >= 30 && durationDays < 60) installmentCount = 2;
  else if (durationDays >= 60 && durationDays < 90) installmentCount = 3;
  else if (durationDays >= 90) installmentCount = 4;

  const installmentAmount = Math.round(totalToRepay / installmentCount);
  const now = new Date();
  const daysPerInstallment = Math.floor(durationDays / installmentCount);

  const installments = [];
  let remainingInstallmentTotal = totalToRepay;

  for (let i = 1; i <= installmentCount; i++) {
    const isLast = i === installmentCount;
    const currentAmount = isLast ? remainingInstallmentTotal : installmentAmount;
    remainingInstallmentTotal -= currentAmount;

    const dueDate = new Date(now.getTime() + (i * daysPerInstallment * 24 * 60 * 60 * 1000));
    installments.push({
      installmentNumber: i,
      amount: currentAmount,
      dueDate,
    });
  }

  return {
    amount,
    durationDays,
    interestRate: rate,
    interestAmount,
    totalToRepay,
    installmentCount,
    installmentAmount,
    installments,
  };
}

/**
 * Synchronizes loans for a user, generates automated alerts & reminders.
 */
export async function syncUserLoans(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        loans: {
          include: {
            installments: true,
          },
        },
      },
    });

    if (!user) return null;

    const now = new Date();
    let totalBorrowed = 0;
    let totalRepaid = 0;
    let activeLoansCount = 0;
    let nextUpcomingDueDate: Date | null = null;
    let nextUpcomingDueAmount: number | null = null;

    for (const loan of user.loans) {
      if (loan.status === "ACTIVE" || loan.status === "OVERDUE" || loan.status === "DISBURSED") {
        totalBorrowed += loan.amount;
        totalRepaid += loan.repaidAmount;
        activeLoansCount++;

        // Check if loan is overdue
        const effectiveDueDate = (loan as any).dueDate || loan.nextDueDate;
        if (effectiveDueDate && new Date(effectiveDueDate) < now && loan.remainingAmount > 0) {
          if (loan.status !== "OVERDUE") {
            await prisma.loan.update({
              where: { id: loan.id },
              data: { status: "OVERDUE" },
            });

            // Create overdue notification
            await prisma.notification.create({
              data: {
                userId: user.id,
                title: "⚠️ Échéance dépassée",
                message: `Le remboursement de votre prêt de ${loan.amount.toLocaleString("fr-FR")} FCFA est en retard. Veuillez régulariser votre situation rapidement.`,
                type: "OVERDUE",
                link: `/app/repay?loanId=${loan.id}`,
              },
            });
          }
        }

        // Check installments & next due date
        for (const inst of loan.installments) {
          if (inst.status === "PENDING") {
            const instDueDate = new Date(inst.dueDate);
            const msUntilDue = instDueDate.getTime() - now.getTime();
            const daysUntilDue = Math.ceil(msUntilDue / (1000 * 60 * 60 * 24));

            // Reminder if due in 3 days or less
            if (daysUntilDue >= 0 && daysUntilDue <= 3) {
              const existingReminder = await prisma.notification.findFirst({
                where: {
                  userId: user.id,
                  type: "DUE_SOON",
                  createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                },
              });

              if (!existingReminder) {
                await prisma.notification.create({
                  data: {
                    userId: user.id,
                    title: "🔔 Rappel d'échéance AfriLoan",
                    message: `Votre échéance de ${inst.amount.toLocaleString("fr-FR")} FCFA arrive à terme dans ${daysUntilDue === 0 ? "aujourd'hui" : `${daysUntilDue} jour(s)`}.`,
                    type: "DUE_SOON",
                    link: `/app/repay?loanId=${loan.id}`,
                  },
                });
              }
            }

            if (!nextUpcomingDueDate || instDueDate < nextUpcomingDueDate) {
              nextUpcomingDueDate = instDueDate;
              nextUpcomingDueAmount = inst.amount - inst.paidAmount;
            }
          }
        }
      } else if (loan.status === "REPAID") {
        totalRepaid += loan.repaidAmount;
      }
    }

    const availableCredit = Math.max(0, user.creditLimit - totalBorrowed);

    // Update user stats
    await prisma.user.update({
      where: { id: user.id },
      data: {
        totalBorrowed,
        totalRepaid,
        availableCredit,
      },
    });

    return {
      activeLoansCount,
      totalBorrowed,
      totalRepaid,
      availableCredit,
      nextUpcomingDueDate,
      nextUpcomingDueAmount,
    };
  } catch (error) {
    console.error("Error in syncUserLoans:", error);
    return null;
  }
}
