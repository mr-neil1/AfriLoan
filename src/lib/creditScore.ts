import prisma from "@/lib/prisma";

export interface ScoreCriterion {
  id: string;
  label: string;
  points: number;
  completed: boolean;
  hint: string;
}

export interface ScoreBreakdown {
  currentScore: number;
  maxScore: number;
  creditLimit: number;
  criteria: ScoreCriterion[];
  nextUnlockLevel?: {
    requiredScore: number;
    unlockedLimit: number;
    missingAction: string;
  };
}

/**
 * Calcule le plafond de crédit autorisé en fonction du score de solvabilité (50 à 1000)
 */
export function calculateCreditLimitFromScore(score: number): number {
  if (score < 50) return 10000;
  if (score < 100) return 10000; // Base: 10 000 FCFA
  if (score < 200) return 25000;
  if (score < 350) return 50000;
  if (score < 500) return 100000;
  if (score < 600) return 200000;
  if (score < 700) return 350000;
  if (score < 800) return 500000;
  if (score < 900) return 1000000;
  return 2000000; // Score 900-1000
}

/**
 * Évalue en détail tous les critères de solvabilité d'un emprunteur
 */
export function evaluateUserCriteria(
  user: any,
  kycDocuments: any[] = [],
  bankAccounts: any[] = [],
  repaidLoansCount: number = 0,
  bankCards: any[] = []
): ScoreBreakdown {
  const criteria: ScoreCriterion[] = [];
  let totalScore = 50; // Score de départ impératif = 50

  // 1. Base création de compte (50 pts par défaut)
  criteria.push({
    id: "ACCOUNT_CREATED",
    label: "Compte AfriLoan créé & vérifié",
    points: 50,
    completed: true,
    hint: "Attribué automatiquement à l'inscription (Éligibilité 10 000 FCFA)"
  });

  // 2. Profil Professionnel & Revenus (+50 pts)
  const hasProfile = Boolean(user.profession && (user.monthlyIncome || user.phone));
  if (hasProfile) totalScore += 50;
  criteria.push({
    id: "PROFILE_EMPLOYMENT",
    label: "Informations professionnelles & revenus renseignés",
    points: 50,
    completed: hasProfile,
    hint: "Renseignez votre secteur d'activité et tranche de revenu"
  });

  // 3. Localisation Domicile Google Maps (+100 pts)
  const hasLocation = Boolean((user.latitude && user.longitude) || (user.address && user.city));
  if (hasLocation) totalScore += 100;
  criteria.push({
    id: "HOME_LOCATION",
    label: "Localisation exacte du domicile vérifiée",
    points: 100,
    completed: hasLocation,
    hint: "Pointez votre domicile sur la carte Google Maps ou entrez votre adresse"
  });

  // 4. Compte Bancaire lié (+150 pts)
  const hasLinkedBank = bankAccounts.length > 0;
  if (hasLinkedBank) totalScore += 150;
  criteria.push({
    id: "BANK_ACCOUNT",
    label: "Compte bancaire national lié",
    points: 150,
    completed: hasLinkedBank,
    hint: "Liez votre compte bancaire (Afriland, SGCI, BGFIBank, Rawbank...)"
  });

  // 4b. Carte Bancaire Certifiée (+100 pts)
  const hasLinkedCard = (bankCards || []).length > 0;
  if (hasLinkedCard) totalScore += 100;
  criteria.push({
    id: "BANK_CARD",
    label: "Carte bancaire (Visa / Mastercard) certifiée",
    points: 100,
    completed: hasLinkedCard,
    hint: "Ajoutez une carte bancaire pour certifier votre moyen de paiement (+100 pts)"
  });

  // 5. CNI Recto / Verso ou Passeport (+150 pts)
  const hasCniApproved = kycDocuments.some(
    d => (d.documentType === "CNI_RECTO" || d.documentType === "PASSPORT") && d.status === "APPROVED"
  );
  const hasCniSubmitted = kycDocuments.some(
    d => (d.documentType === "CNI_RECTO" || d.documentType === "PASSPORT")
  );
  if (hasCniApproved) {
    totalScore += 150;
  } else if (hasCniSubmitted) {
    totalScore += 50; // Bonus d'encouragement tant que c'est en attente de revue
  }
  criteria.push({
    id: "CNI_DOCUMENT",
    label: "Pièce d'identité (CNI / Passeport) vérifiée",
    points: 150,
    completed: hasCniApproved,
    hint: hasCniSubmitted && !hasCniApproved 
      ? "Document transmis, en cours de validation par nos agents (+100 pts restants)"
      : "Importez ou photographiez votre CNI ou passeport"
  });

  // 6. Photo Selfie en direct (+50 pts)
  const hasSelfie = kycDocuments.some(
    d => d.documentType === "SELFIE_PHOTO" && d.status === "APPROVED"
  );
  const hasSelfieSubmitted = kycDocuments.some(d => d.documentType === "SELFIE_PHOTO");
  if (hasSelfie) {
    totalScore += 50;
  } else if (hasSelfieSubmitted) {
    totalScore += 25;
  }
  criteria.push({
    id: "SELFIE_PHOTO",
    label: "Photo selfie prise sur la plateforme",
    points: 50,
    completed: hasSelfie,
    hint: "Prenez une photo claire de votre visage avec la caméra AfriLoan"
  });

  // 7. Vidéo KYC de vivacité prise sur la plateforme (+100 pts)
  const hasVideo = kycDocuments.some(
    d => d.documentType === "KYC_VIDEO" && d.status === "APPROVED"
  );
  const hasVideoSubmitted = kycDocuments.some(d => d.documentType === "KYC_VIDEO");
  if (hasVideo) {
    totalScore += 100;
  } else if (hasVideoSubmitted) {
    totalScore += 50;
  }
  criteria.push({
    id: "KYC_VIDEO",
    label: "Vidéo KYC de vivacité enregistrée sur la plateforme",
    points: 100,
    completed: hasVideo,
    hint: "Enregistrez une courte vidéo de 5 secondes pour confirmer votre identité"
  });

  // 8. Contact d'urgence / Garant (+50 pts)
  const hasEmergencyContact = Boolean(user.emergencyContactName && user.emergencyContactPhone);
  if (hasEmergencyContact) totalScore += 50;
  criteria.push({
    id: "EMERGENCY_CONTACT",
    label: "Personne de référence / contact d'urgence",
    points: 50,
    completed: hasEmergencyContact,
    hint: "Renseignez un proche à contacter en cas de besoin"
  });

  // 9. Prêts remboursés sans incident (+50 pts par prêt remboursé, jusqu'à 300 pts)
  const historyPoints = Math.min(repaidLoansCount * 50, 300);
  if (historyPoints > 0) totalScore += historyPoints;
  criteria.push({
    id: "REPAYMENT_HISTORY",
    label: `Historique de remboursement (${repaidLoansCount} prêt(s) soldé(s))`,
    points: historyPoints,
    completed: repaidLoansCount > 0,
    hint: "+50 points pour chaque prêt remboursé à date"
  });

  // Plafonner à 1000
  totalScore = Math.min(totalScore, 1000);
  const creditLimit = calculateCreditLimitFromScore(totalScore);

  return {
    currentScore: totalScore,
    maxScore: 1000,
    creditLimit,
    criteria
  };
}

/**
 * Recalcule et persiste le score et la limite d'un utilisateur en Base de Données
 */
export async function recalculateUserScore(userId: string, reason?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycDocuments: true,
        bankAccounts: true,
        bankCards: true,
        loans: {
          where: { status: "REPAID" }
        }
      }
    });

    if (!user) return null;

    const repaidCount = user.loans.length;
    const breakdown = evaluateUserCriteria(
      user,
      user.kycDocuments,
      user.bankAccounts,
      repaidCount,
      user.bankCards
    );

    const oldScore = user.creditScore;
    const newScore = breakdown.currentScore;
    const newLimit = breakdown.creditLimit;

    // Déterminer le statut KYC global
    const hasApprovedCni = user.kycDocuments.some(d => (d.documentType === "CNI_RECTO" || d.documentType === "PASSPORT") && d.status === "APPROVED");
    const hasRejectedDoc = user.kycDocuments.some(d => d.status === "REJECTED");
    const hasPendingDoc = user.kycDocuments.some(d => d.status === "PENDING");

    let kycStatus = user.kycStatus;
    if (hasApprovedCni) {
      kycStatus = "VERIFIED";
    } else if (hasRejectedDoc) {
      kycStatus = "REJECTED";
    } else if (hasPendingDoc) {
      kycStatus = "PENDING";
    }

    // Calculer le crédit disponible résiduel
    const activeLoans = await prisma.loan.findMany({
      where: {
        userId,
        status: { in: ["ACTIVE", "DISBURSED", "PENDING"] }
      }
    });
    const currentBorrowed = activeLoans.reduce((sum, l) => sum + (l.remainingAmount || l.amount), 0);
    const availableCredit = Math.max(0, newLimit - currentBorrowed);

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        creditScore: newScore,
        creditLimit: newLimit,
        availableCredit,
        kycStatus
      }
    });

    // Journaliser si le score a changé
    if (oldScore !== newScore) {
      await prisma.creditScoreLog.create({
        data: {
          userId,
          oldScore,
          newScore,
          changeReason: reason || `Mise à jour automatique des critères (${oldScore} ➔ ${newScore})`
        }
      });
    }

    return {
      user: updatedUser,
      breakdown
    };
  } catch (error) {
    console.error("Erreur lors du recalcul du score de solvabilité:", error);
    return null;
  }
}
