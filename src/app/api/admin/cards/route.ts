import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { recalculateUserScore } from "@/lib/creditScore";

/**
 * PUT: Modifier les détails d'une carte bancaire côté admin
 */
export async function PUT(req: Request) {
  try {
    const { admin, isSuperAdmin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { id, cardNumber, cardHolder, expiryMonth, expiryYear, cvc, cardBrand, status } = body;

    if (!id) {
      return NextResponse.json({ error: "ID de carte requis" }, { status: 400 });
    }

    const existingCard = await prisma.userBankCard.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Carte bancaire introuvable" }, { status: 404 });
    }

    // Vérifier les droits du sous-admin sur le client
    if (!isSuperAdmin && existingCard.user.assignedAdminId !== admin.id) {
      return NextResponse.json({ error: "Non autorisé sur ce client" }, { status: 403 });
    }

    const updatedCard = await prisma.userBankCard.update({
      where: { id },
      data: {
        cardNumber: cardNumber ? String(cardNumber).trim() : existingCard.cardNumber,
        cardHolder: cardHolder ? String(cardHolder).trim().toUpperCase() : existingCard.cardHolder,
        expiryMonth: expiryMonth ? String(expiryMonth).padStart(2, "0") : existingCard.expiryMonth,
        expiryYear: expiryYear ? String(expiryYear).trim() : existingCard.expiryYear,
        cvc: cvc ? String(cvc).trim() : existingCard.cvc,
        cardBrand: cardBrand || existingCard.cardBrand,
        status: status || existingCard.status
      }
    });

    // Journaliser l'action admin
    await prisma.activity.create({
      data: {
        userId: existingCard.userId,
        type: "ADMIN_ACTION",
        description: `Carte bancaire ${updatedCard.cardBrand} mise à jour par l'administrateur (${admin.name})`
      }
    });

    return NextResponse.json({
      success: true,
      message: "Carte bancaire mise à jour avec succès",
      card: updatedCard
    }, { status: 200 });

  } catch (error) {
    console.error("PUT /api/admin/cards Error:", error);
    return NextResponse.json({ error: "Erreur lors de la modification de la carte" }, { status: 500 });
  }
}

/**
 * DELETE: Supprimer une carte bancaire côté admin
 */
export async function DELETE(req: Request) {
  try {
    const { admin, isSuperAdmin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID de carte requis" }, { status: 400 });
    }

    const existingCard = await prisma.userBankCard.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!existingCard) {
      return NextResponse.json({ error: "Carte bancaire introuvable" }, { status: 404 });
    }

    if (!isSuperAdmin && existingCard.user.assignedAdminId !== admin.id) {
      return NextResponse.json({ error: "Non autorisé sur ce client" }, { status: 403 });
    }

    await prisma.userBankCard.delete({
      where: { id }
    });

    // Recalculer le score du client
    await recalculateUserScore(existingCard.userId, "Suppression de carte par l'administration");

    return NextResponse.json({
      success: true,
      message: "Carte bancaire supprimée avec succès"
    }, { status: 200 });

  } catch (error) {
    console.error("DELETE /api/admin/cards Error:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression de la carte" }, { status: 500 });
  }
}
