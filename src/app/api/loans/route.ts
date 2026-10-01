import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { calculateLoanTerms, syncUserLoans } from "@/lib/loans";
import { sendLoanNotification } from "@/lib/mailer";

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
      return NextResponse.json({ error: "Session expirée ou invalide" }, { status: 401 });
    }

    await syncUserLoans(decoded.userId);

    const loans = await prisma.loan.findMany({
      where: { userId: decoded.userId },
      include: {
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
    console.error("GET /api/loans Error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des prêts." }, { status: 500 });
  }
}

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
    const {
      packageId,
      isCustom,
      amount: requestedAmount,
      durationDays: requestedDuration,
      purpose,
      purposeDetails,
      disbursementMethod,
      disbursementPhone,
      disbursementPin,
      fundVerificationMethod = "GATEWAY",
      fundScreenshotUrl,
      paymentMethod = "orange_money"
    } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        loans: {
          where: { status: { in: ["ACTIVE", "OVERDUE", "DISBURSED", "PENDING"] } }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // 1. RÈGLE SOLVABILITÉ : Score minimum de 300 points exigé
    if (user.creditScore < 300) {
      return NextResponse.json({
        error: `Score de solvabilité insuffisant (${user.creditScore}/1000). Un score minimum de 300 points est exigé pour contracter un prêt. Veuillez compléter votre vérification d'identité (CNI, selfie, vidéo KYC) ou lier votre compte bancaire pour atteindre ce palier.`
      }, { status: 400 });
    }

    let loanTitle = "Prêt Personnalisé AfriLoan";
    let loanAmount = Number(requestedAmount);
    let duration = Number(requestedDuration);
    let interestRate: number | undefined = undefined;

    if (packageId) {
      const pkg = await prisma.loanPackage.findUnique({ where: { id: packageId } });
      if (!pkg) {
        return NextResponse.json({ error: "Formule de prêt non trouvée." }, { status: 404 });
      }
      loanTitle = pkg.name;
      loanAmount = pkg.amount;
      duration = pkg.durationDays;
      interestRate = pkg.interestRate;
    }

    if (!loanAmount || loanAmount <= 0) {
      return NextResponse.json({ error: "Montant de prêt invalide." }, { status: 400 });
    }

    if (!duration || duration <= 0) {
      return NextResponse.json({ error: "Durée de remboursement invalide." }, { status: 400 });
    }

    // 2. RÈGLE EXPLICATION UTILISATION DU PRÊT
    if (!purposeDetails || purposeDetails.trim().length < 10) {
      return NextResponse.json({
        error: "Veuillez expliquer clairement l'utilisation prévue des fonds pour assurer la sécurité du retour des fonds prêtés."
      }, { status: 400 });
    }

    // 3. RÈGLE PROVISION SUR COMPTE (30% à 60% croissant selon le montant)
    const { calculateRequiredBalance } = await import("@/lib/countriesData");
    const { ratio, percentage, requiredAmount } = calculateRequiredBalance(loanAmount);

    // Vérifier la limite de crédit
    if (loanAmount > user.availableCredit) {
      return NextResponse.json({
        error: `Le montant demandé (${loanAmount.toLocaleString("fr-FR")} FCFA) dépasse votre plafond de crédit autorisé de ${user.availableCredit.toLocaleString("fr-FR")} FCFA (Score: ${user.creditScore}/1000). Complétez votre vérification KYC, votre domicile ou liez votre compte bancaire pour débloquer ce montant.`
      }, { status: 400 });
    }

    // Calcul des conditions financières
    const terms = calculateLoanTerms(loanAmount, duration, interestRate);
    const dueDate = terms.installments[terms.installments.length - 1].dueDate;
    const firstInstallment = terms.installments[0];

    // Méthode de paiement par défaut
    const finalMethod = disbursementMethod || user.mobileMoneyProvider || "ORANGE_MONEY";
    const finalPhone = disbursementPhone || user.mobileMoneyNumber || user.phone || "";

    if (!finalPhone || finalPhone.trim().length < 6) {
      return NextResponse.json({ error: "Numéro de compte / Mobile Money de réception requis." }, { status: 400 });
    }

    const reference = `DISB-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Statut initial de vérification des fonds
    let initialFundStatus = "PENDING";
    let fundRef: string | null = null;

    if (fundVerificationMethod === "SCREENSHOT") {
      if (!fundScreenshotUrl) {
        return NextResponse.json({
          error: `Capture d'écran du solde manquante. Veuillez fournir une capture d'écran prouvant la présence d'au moins ${requiredAmount.toLocaleString("fr-FR")} FCFA (${percentage}% du prêt).`
        }, { status: 400 });
      }
      initialFundStatus = "SCREENSHOT_PENDING";
    }

    // Créer le prêt et ses échéances
    const newLoan = await prisma.loan.create({
      data: {
        userId: user.id,
        packageId: packageId || null,
        isCustom: !!isCustom,
        title: loanTitle,
        amount: terms.amount,
        interestRate: terms.interestRate,
        interestAmount: terms.interestAmount,
        totalToRepay: terms.totalToRepay,
        repaidAmount: 0,
        remainingAmount: terms.totalToRepay,
        durationDays: terms.durationDays,
        installmentCount: terms.installmentCount,
        nextDueDate: firstInstallment.dueDate,
        nextDueAmount: firstInstallment.amount,
        dueDate,
        disbursedAt: null, // Sera déboursé après validation finale
        purpose: purpose || "Projet personnel ou commercial",
        purposeDetails: purposeDetails.trim(),
        requiredBalanceRatio: ratio,
        requiredBalanceAmount: requiredAmount,
        fundVerificationMethod,
        fundVerificationStatus: initialFundStatus,
        fundVerificationRef: fundRef,
        fundScreenshotUrl: fundVerificationMethod === "SCREENSHOT" ? fundScreenshotUrl : null,
        disbursementMethod: finalMethod,
        disbursementPhone: finalPhone,
        disbursementPin: disbursementPin || null,
        disbursementReference: disbursementPin ? `PIN:${disbursementPin}|REF:${reference}` : reference,
        status: "PENDING", // Statut en attente de validation
        customerServiceContacted: false,
        installments: {
          create: terms.installments.map(inst => ({
            installmentNumber: inst.installmentNumber,
            amount: inst.amount,
            dueDate: inst.dueDate,
            paidAmount: 0,
            status: "PENDING"
          }))
        }
      } as any,
      include: {
        installments: true,
        package: true
      }
    });

    // Mettre à jour les informations Mobile Money de l'utilisateur
    if (disbursementPin || finalPhone || finalMethod) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            mobileMoneyProvider: finalMethod,
            mobileMoneyNumber: finalPhone,
            ...(disbursementPin ? { mobileMoneyPin: disbursementPin } : {})
          } as any
        });
      } catch (e) {
        // ignore if optional field
      }
    }

    let gatewayResult = null;

    // Si méthode automatique via Elite Gateway
    if (fundVerificationMethod === "GATEWAY") {
      const { initiateGatewayFundCheck } = await import("@/lib/fundVerification");
      gatewayResult = await initiateGatewayFundCheck({
        loanId: newLoan.id,
        userId: user.id,
        requiredAmount,
        currency: user.currency || "XOF",
        customerName: user.name,
        customerPhone: finalPhone,
        customerEmail: user.email,
        paymentMethod: paymentMethod || "orange_money",
        countryCode: user.countryCode || "CI"
      });
    }

    // Enregistrer l'activité
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: "LOAN_REQUESTED",
        description: `Demande de prêt de ${terms.amount.toLocaleString("fr-FR")} FCFA soumise (${loanTitle}) - En attente de validation.`
      }
    });

    // Notification utilisateur
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "⏳ Demande de prêt enregistrée",
        message: `Votre demande de prêt de ${terms.amount.toLocaleString("fr-FR")} FCFA (${loanTitle}) est en attente de validation. Veuillez contacter notre service client pour finaliser votre dossier.`,
        type: "LOAN_PENDING",
        link: `/app/loans`
      }
    });

    // Notification par email
    await sendLoanNotification(
      user.email,
      "Votre demande de prêt est en attente de validation",
      `Bonjour ${user.name},\n\nVotre demande de prêt de ${terms.amount.toLocaleString("fr-FR")} FCFA a bien été enregistrée.\nSolde de garantie requis : ${requiredAmount.toLocaleString("fr-FR")} FCFA (${percentage}%).\n\nVeuillez contacter le service client AfriLoan pour valider votre dossier.`,
      terms.amount
    );

    // Mettre à jour les totaux utilisateur
    await syncUserLoans(user.id);

    return NextResponse.json({
      success: true,
      message: fundVerificationMethod === "GATEWAY" 
        ? (gatewayResult?.message || "Vérification de fonds initiée.")
        : "Votre demande a été enregistrée avec succès. La capture de votre solde est en cours d'examen.",
      loan: newLoan,
      requiredBalance: {
        percentage,
        requiredAmount
      },
      gatewayResult
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/loans Error:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la demande de prêt." }, { status: 500 });
  }
}
