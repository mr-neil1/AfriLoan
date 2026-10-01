import prisma from "@/lib/prisma";

export interface FundCheckParams {
  loanId: string;
  userId: string;
  requiredAmount: number;
  currency: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod: string;
  countryCode: string;
}

export interface FundCheckResult {
  success: boolean;
  reference: string;
  checkoutUrl?: string;
  status: "PENDING" | "VERIFIED" | "FAILED";
  message: string;
  instructionType?: string;
  isSimulated?: boolean;
}

/**
 * Initie une vérification de solde / provision via la passerelle privée Elite Classroom (GeniusPay)
 */
export async function initiateGatewayFundCheck(params: FundCheckParams): Promise<FundCheckResult> {
  const gatewayUrl = process.env.ELITE_GATEWAY_URL || "http://localhost:3000";
  const gatewayKey = process.env.ELITE_GATEWAY_KEY || "elite_gw_sec_2026_joinvesting_getpay_live";

  console.log(`[AfriLoan -> Elite Gateway] Vérification de fonds (${params.requiredAmount} ${params.currency}) pour prêt ${params.loanId}`);

  try {
    const res = await fetch(`${gatewayUrl.replace(/\/$/, "")}/api/gateway/v1/payments/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Gateway-Key": gatewayKey,
        "X-Client-Id": "afriloan"
      },
      body: JSON.stringify({
        amount: params.requiredAmount,
        currency: params.currency === "FCFA" ? "XOF" : params.currency || "XOF",
        description: `Vérification solvabilité compte - AfriLoan dossier #${params.loanId.slice(-6)}`,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerEmail: params.customerEmail || `${params.userId.slice(0, 8)}@afriloan.com`,
        countryCode: params.countryCode || "CI",
        paymentMethod: params.paymentMethod || "orange_money",
        metadata: {
          loan_id: params.loanId,
          user_id: params.userId,
          verification_type: "FUND_COLLATERAL_CHECK",
          source: "afriloan"
        }
      })
    });

    const data = await res.json();
    console.log(`[AfriLoan Gateway Response ${res.status}]:`, data);

    if (res.ok && data.success && data.reference) {
      // Mettre à jour le prêt avec la référence
      await prisma.loan.update({
        where: { id: params.loanId },
        data: {
          fundVerificationRef: data.reference,
          fundVerificationMethod: "GATEWAY",
          fundVerificationStatus: data.status === "COMPLETED" ? "VERIFIED" : "PENDING"
        }
      });

      return {
        success: true,
        reference: data.reference,
        checkoutUrl: data.checkoutUrl,
        status: data.status === "COMPLETED" ? "VERIFIED" : "PENDING",
        message: data.message || "Push de vérification des fonds envoyé vers votre mobile.",
        instructionType: data.instructionType
      };
    } else {
      const errMsg = data.error || data.message || `Statut passerelle: ${res.status}`;
      console.warn("Échec réponse passerelle Elite Classroom:", errMsg);
      
      // Si la passerelle indique solde insuffisant
      const isInsufficientFunds = errMsg.toLowerCase().includes("solde") || errMsg.toLowerCase().includes("insufficient") || errMsg.toLowerCase().includes("failed");

      await prisma.loan.update({
        where: { id: params.loanId },
        data: {
          fundVerificationMethod: "GATEWAY",
          fundVerificationStatus: "FAILED"
        }
      });

      return {
        success: false,
        reference: `FAIL-${Date.now()}`,
        status: "FAILED",
        message: isInsufficientFunds 
          ? "Solde insuffisant détecté sur votre compte récepteur. Le montant de garantie (30% à 60%) doit être présent."
          : `Échec de vérification passerelle : ${errMsg}`
      };
    }
  } catch (error: any) {
    console.warn("[AfriLoan Gateway] Passerelle injoignable, passage en mode de vérification assistée:", error.message);

    // Mode simulation / fallback en cas de serveur de passerelle local éteint
    const simulatedRef = `AFR-SIM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Si le numéro se termine par 00, on simule un solde insuffisant pour les tests
    const simulateFailure = params.customerPhone.endsWith("00");

    await prisma.loan.update({
      where: { id: params.loanId },
      data: {
        fundVerificationRef: simulatedRef,
        fundVerificationMethod: "GATEWAY",
        fundVerificationStatus: simulateFailure ? "FAILED" : "PENDING"
      }
    });

    return {
      success: !simulateFailure,
      reference: simulatedRef,
      status: simulateFailure ? "FAILED" : "PENDING",
      isSimulated: true,
      message: simulateFailure 
        ? "Solde insuffisant détecté sur votre compte. Veuillez recharger votre compte ou fournir une capture d'écran."
        : "Demande de vérification de provision transmise. En attente de validation ou confirmation USSD."
    };
  }
}

/**
 * Vérifie le statut d'une transaction de vérification auprès d'Elite Classroom
 */
export async function checkGatewayFundStatus(reference: string): Promise<{
  status: "PENDING" | "VERIFIED" | "FAILED";
  message: string;
}> {
  const gatewayUrl = process.env.ELITE_GATEWAY_URL || "http://localhost:3000";
  const gatewayKey = process.env.ELITE_GATEWAY_KEY || "elite_gw_sec_2026_joinvesting_getpay_live";

  try {
    const res = await fetch(`${gatewayUrl.replace(/\/$/, "")}/api/gateway/v1/payments/status?reference=${encodeURIComponent(reference)}`, {
      headers: {
        "X-Gateway-Key": gatewayKey,
        "X-Client-Id": "afriloan"
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === "COMPLETED" || data.status === "SUCCESS") {
        return { status: "VERIFIED", message: "Fonds vérifiés avec succès." };
      }
      if (data.status === "FAILED" || data.status === "CANCELLED") {
        return { status: "FAILED", message: "Échec : solde insuffisant ou rejet du titulaire." };
      }
    }
  } catch (e) {
    // ignore
  }

  return { status: "PENDING", message: "Vérification en cours." };
}
