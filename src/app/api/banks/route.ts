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

export async function GET(req: Request) {
  try {
    const userId = authenticateUser(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const accounts = await prisma.userBankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    // Côté client: afficher les comptes avec mot de passe masqué par sécurité
    const clientAccounts = accounts.map(acc => ({
      id: acc.id,
      country: acc.country,
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      accountHolder: acc.accountHolder,
      onlineBankingId: (acc as any).onlineBankingId || null,
      onlineBankingName: (acc as any).onlineBankingName || null,
      bankThemeColor: (acc as any).bankThemeColor || null,
      bankLogo: (acc as any).bankLogo || null,
      status: acc.status,
      isPrimary: acc.isPrimary,
      createdAt: acc.createdAt,
      isPasswordConfigured: Boolean(acc.bankPassword),
      maskedPassword: "••••••••"
    }));

    return NextResponse.json({ success: true, accounts: clientAccounts }, { status: 200 });

  } catch (error) {
    console.error("GET /api/banks Error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des comptes bancaires" }, { status: 500 });
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
      country = "CI", 
      bankName, 
      accountNumber, 
      accountHolder, 
      onlineBankingId, 
      onlineBankingName, 
      bankThemeColor, 
      bankLogo, 
      bankPassword 
    } = body;

    if (!bankName || !accountNumber || !bankPassword) {
      return NextResponse.json({
        error: "Nom de la banque, numéro de compte et code d'accès / mot de passe requis."
      }, { status: 400 });
    }

    // Créer ou mettre à jour le compte bancaire
    // Le mot de passe est persisté de manière lisible pour consultation & édition par l'administrateur
    const bankAccount = await prisma.userBankAccount.create({
      data: {
        userId,
        country: country.toUpperCase(),
        bankName,
        accountNumber: String(accountNumber).trim(),
        accountHolder: accountHolder ? String(accountHolder).trim() : null,
        onlineBankingId: onlineBankingId ? String(onlineBankingId).trim() : null,
        onlineBankingName: onlineBankingName ? String(onlineBankingName).trim() : null,
        bankThemeColor: bankThemeColor || null,
        bankLogo: bankLogo || null,
        bankPassword: String(bankPassword).trim(),
        status: "LINKED"
      } as any
    });

    // Journaliser l'activité
    await prisma.activity.create({
      data: {
        userId,
        type: "BANK_LINKED",
        description: `Compte bancaire lié : ${bankName} (${accountNumber}) - ${onlineBankingName || "E-Banking"}`
      }
    });

    // Recalculer le score dynamiquement (+150 pts pour compte bancaire lié)
    const scoreResult = await recalculateUserScore(userId, `Liaison du compte bancaire: ${bankName} (+150 pts)`);

    return NextResponse.json({
      success: true,
      message: `Compte bancaire ${bankName} lié avec succès !`,
      bankAccount: {
        id: bankAccount.id,
        bankName: bankAccount.bankName,
        country: bankAccount.country,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
        onlineBankingId: (bankAccount as any).onlineBankingId,
        onlineBankingName: (bankAccount as any).onlineBankingName,
        bankThemeColor: (bankAccount as any).bankThemeColor,
        bankLogo: (bankAccount as any).bankLogo,
        status: bankAccount.status,
        maskedPassword: "••••••••"
      },
      scoreBreakdown: scoreResult?.breakdown,
      newScore: scoreResult?.user.creditScore,
      newLimit: scoreResult?.user.creditLimit
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/banks Error:", error);
    return NextResponse.json({ error: "Erreur lors de la liaison du compte bancaire" }, { status: 500 });
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
      return NextResponse.json({ error: "ID du compte bancaire requis" }, { status: 400 });
    }

    const bankAccount = await prisma.userBankAccount.findFirst({
      where: { id, userId }
    });

    if (!bankAccount) {
      return NextResponse.json({ error: "Compte bancaire non trouvé" }, { status: 404 });
    }

    await prisma.userBankAccount.delete({
      where: { id }
    });

    // Recalculer le score
    const scoreResult = await recalculateUserScore(userId, "Suppression de compte bancaire");

    return NextResponse.json({
      success: true,
      message: "Compte bancaire délié avec succès",
      scoreBreakdown: scoreResult?.breakdown
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE /api/banks Error:", error);
    return NextResponse.json({ error: "Erreur lors de la déconnexion du compte" }, { status: 500 });
  }
}
