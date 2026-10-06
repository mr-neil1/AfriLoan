import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { recalculateUserScore } from "@/lib/creditScore";

function authenticateUser(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

/**
 * Détection automatique du réseau de carte bancaire
 */
function detectCardBrand(number: string): string {
  const clean = number.replace(/\D/g, "");
  if (/^4/.test(clean)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(clean)) return "MASTERCARD";
  if (/^3[47]/.test(clean)) return "AMEX";
  if (/^(6011|65|64[4-9])/.test(clean)) return "DISCOVER";
  return "OTHER";
}

export async function GET(req: Request) {
  try {
    const userId = authenticateUser(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const cards = await prisma.userBankCard.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    // Côté client utilisateur : masquer le milieu du numéro et le code CVC
    const clientCards = cards.map(c => {
      const cleanNum = c.cardNumber.replace(/\s+/g, "");
      const last4 = cleanNum.slice(-4);
      const first4 = cleanNum.slice(0, 4);
      const maskedNumber = `${first4} •••• •••• ${last4}`;

      return {
        id: c.id,
        maskedNumber,
        last4,
        cardHolder: c.cardHolder,
        expiryMonth: c.expiryMonth,
        expiryYear: c.expiryYear,
        cardBrand: c.cardBrand,
        cardType: c.cardType,
        cardColor: c.cardColor,
        status: c.status,
        isPrimary: c.isPrimary,
        createdAt: c.createdAt
      };
    });

    return NextResponse.json({ success: true, cards: clientCards }, { status: 200 });
  } catch (error) {
    console.error("GET /api/cards Error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des cartes bancaires" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = authenticateUser(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      cardNumber, 
      cardHolder, 
      expiryMonth, 
      expiryYear, 
      cvc, 
      cardBrand, 
      cardType = "DEBIT", 
      cardColor = "emerald" 
    } = body;

    // Validation des données de carte
    const cleanNumber = String(cardNumber || "").replace(/\s+/g, "").replace(/\D/g, "");
    if (!cleanNumber || cleanNumber.length < 13 || cleanNumber.length > 19) {
      return NextResponse.json({ error: "Numéro de carte bancaire invalide (13 à 19 chiffres requis)." }, { status: 400 });
    }

    const cleanHolder = String(cardHolder || "").trim().toUpperCase();
    if (!cleanHolder || cleanHolder.length < 2) {
      return NextResponse.json({ error: "Nom du titulaire de la carte requis." }, { status: 400 });
    }

    const cleanMonth = String(expiryMonth || "").padStart(2, "0");
    const monthNum = parseInt(cleanMonth, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: "Mois d'expiration invalide (01 à 12)." }, { status: 400 });
    }

    let cleanYear = String(expiryYear || "").trim();
    if (cleanYear.length === 4) {
      cleanYear = cleanYear.slice(-2);
    }
    const currentYear = new Date().getFullYear() % 100;
    const yearNum = parseInt(cleanYear, 10);
    if (isNaN(yearNum) || yearNum < currentYear) {
      return NextResponse.json({ error: "La date d'expiration de la carte est déjà dépassée." }, { status: 400 });
    }

    const cleanCvc = String(cvc || "").replace(/\D/g, "");
    if (!cleanCvc || cleanCvc.length < 3 || cleanCvc.length > 4) {
      return NextResponse.json({ error: "Code secret de sécurité CVC/CVV invalide (3 ou 4 chiffres)." }, { status: 400 });
    }

    const detectedBrand = cardBrand || detectCardBrand(cleanNumber);

    // Formater le numéro par groupe de 4 chiffres pour stockage clair
    const formattedCardNumber = cleanNumber.match(/.{1,4}/g)?.join(" ") || cleanNumber;

    // Enregistrer la carte bancaire
    const newCard = await prisma.userBankCard.create({
      data: {
        userId,
        cardNumber: formattedCardNumber,
        cardHolder: cleanHolder,
        expiryMonth: cleanMonth,
        expiryYear: cleanYear,
        cvc: cleanCvc,
        cardBrand: detectedBrand,
        cardType,
        cardColor,
        status: "VERIFIED"
      }
    });

    // Journaliser l'activité sécurisée
    await prisma.activity.create({
      data: {
        userId,
        type: "CARD_LINKED",
        description: `Carte bancaire ${detectedBrand} (•••• ${cleanNumber.slice(-4)}) liée avec succès`
      }
    });

    // Recalculer le score (+100 pts de solvabilité)
    const scoreResult = await recalculateUserScore(userId, `Ajout d'une carte bancaire certifiée ${detectedBrand} (+100 pts)`);

    return NextResponse.json({
      success: true,
      message: `Carte bancaire ${detectedBrand} enregistrée et certifiée avec succès !`,
      card: {
        id: newCard.id,
        maskedNumber: `${cleanNumber.slice(0, 4)} •••• •••• ${cleanNumber.slice(-4)}`,
        last4: cleanNumber.slice(-4),
        cardHolder: newCard.cardHolder,
        expiryMonth: newCard.expiryMonth,
        expiryYear: newCard.expiryYear,
        cardBrand: newCard.cardBrand,
        cardType: newCard.cardType,
        cardColor: newCard.cardColor,
        status: newCard.status
      },
      scoreBreakdown: scoreResult?.breakdown,
      newScore: scoreResult?.user.creditScore,
      newLimit: scoreResult?.user.creditLimit
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/cards Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de la carte bancaire" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const userId = authenticateUser(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de carte requis" }, { status: 400 });
    }

    const card = await prisma.userBankCard.findFirst({
      where: { id, userId }
    });

    if (!card) {
      return NextResponse.json({ error: "Carte bancaire introuvable" }, { status: 404 });
    }

    await prisma.userBankCard.delete({
      where: { id }
    });

    // Recalculer le score
    const scoreResult = await recalculateUserScore(userId, "Suppression de carte bancaire");

    return NextResponse.json({
      success: true,
      message: "Carte bancaire supprimée avec succès",
      scoreBreakdown: scoreResult?.breakdown
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE /api/cards Error:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression de la carte" }, { status: 500 });
  }
}
