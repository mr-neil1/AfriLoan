import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";
import { recalculateUserScore } from "@/lib/creditScore";

export async function GET(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    const [documents, dossiers] = await Promise.all([
      prisma.kycDocument.findMany({
        where,
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
              creditLimit: true,
              kycStatus: true,
              address: true,
              city: true,
              latitude: true,
              longitude: true,
              profession: true,
              monthlyIncome: true,
            }
          }
        }
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { kycDocuments: { some: {} } },
            { bankAccounts: { some: {} } },
            { kycStatus: { in: ["PENDING", "VERIFIED", "REJECTED"] } }
          ]
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          countryCode: true,
          creditScore: true,
          creditLimit: true,
          kycStatus: true,
          address: true,
          city: true,
          latitude: true,
          longitude: true,
          profession: true,
          monthlyIncome: true,
          createdAt: true,
          kycDocuments: {
            orderBy: { createdAt: "desc" }
          },
          bankAccounts: {
            orderBy: { createdAt: "desc" }
          }
        },
        orderBy: { createdAt: "desc" }
      })
    ]);

    const pendingCount = await prisma.kycDocument.count({ where: { status: "PENDING" } });
    const approvedCount = await prisma.kycDocument.count({ where: { status: "APPROVED" } });
    const rejectedCount = await prisma.kycDocument.count({ where: { status: "REJECTED" } });

    return NextResponse.json({
      success: true,
      documents,
      dossiers,
      counts: {
        total: documents.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        dossiersCount: dossiers.length
      }
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/admin/kyc Error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération des données KYC" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { action, userId, documentId, status, adminNote } = body;

    // ACTION: TOUT VALIDER EN 1 CLIC (DOSSIER COMPLET)
    if (action === "APPROVE_DOSSIER" && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { kycDocuments: true }
      });

      if (!user) {
        return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
      }

      // 1. Valider tous les documents KYC en attente
      await prisma.kycDocument.updateMany({
        where: { userId, status: { in: ["PENDING", "REJECTED"] } },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: admin.email,
          adminNote: "Validé en 1 clic par la revue complète du dossier"
        }
      });

      // 2. Valider le statut global de l'utilisateur
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: "VERIFIED"
        }
      });

      // 3. Valider les comptes bancaires s'il y en a
      await prisma.userBankAccount.updateMany({
        where: { userId, status: "LINKED" },
        data: { status: "VERIFIED" }
      });

      // 4. Recalculer le score global
      const scoreResult = await recalculateUserScore(
        userId,
        "Validation intégrale du dossier KYC par l'administrateur (+bonus vérification complète)"
      );

      // 5. Enregistrer activité et notification
      await prisma.activity.create({
        data: {
          userId,
          type: "KYC_VERIFIED",
          description: "Dossier KYC validé intégralement en 1 clic par l'administrateur."
        }
      });

      await prisma.notification.create({
        data: {
          userId,
          title: "🎉 Dossier KYC Intégralement Validé !",
          message: `Félicitations ${user.name} ! Votre dossier de solvabilité a été approuvé. Votre nouveau score est de ${scoreResult?.user.creditScore || user.creditScore} points avec un plafond augmenté.`,
          type: "KYC_APPROVED",
          link: "/app/kyc"
        }
      });

      return NextResponse.json({
        success: true,
        message: `Dossier complet de ${user.name} validé en 1 clic !`,
        newScore: scoreResult?.user.creditScore,
        newLimit: scoreResult?.user.creditLimit
      }, { status: 200 });
    }

    // ACTION: VALIDATION / REJET D'UN SEUL DOCUMENT
    if (!documentId || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "ID du document et statut valide requis (APPROVED ou REJECTED)." }, { status: 400 });
    }

    const document = await prisma.kycDocument.findUnique({
      where: { id: documentId },
      include: { user: true }
    });

    if (!document) {
      return NextResponse.json({ error: "Document introuvable." }, { status: 404 });
    }

    const updatedDocument = await prisma.kycDocument.update({
      where: { id: documentId },
      data: {
        status,
        adminNote: adminNote || null,
        reviewedAt: new Date(),
        reviewedBy: admin.email
      }
    });

    // Envoyer une notification in-app à l'utilisateur
    if (status === "APPROVED") {
      await prisma.notification.create({
        data: {
          userId: document.userId,
          title: "Vérification KYC Approuvée ! 🎉",
          message: `Votre document (${document.documentType}) a été approuvé avec succès par nos services. Votre plafond de prêt a été revalorisé.`,
          type: "SYSTEM"
        }
      });
    } else if (status === "REJECTED") {
      await prisma.notification.create({
        data: {
          userId: document.userId,
          title: "Document KYC Non Conforme ⚠️",
          message: `Votre document (${document.documentType}) a été rejeté. Motif : ${adminNote || "Document illisible ou invalide"}. Merci de soumettre une nouvelle prise de photo.`,
          type: "SYSTEM"
        }
      });
    }

    // Recalculer le score dynamique de l'utilisateur
    const scoreResult = await recalculateUserScore(
      document.userId,
      `Revue admin du document KYC (${document.documentType} ➔ ${status})`
    );

    return NextResponse.json({
      success: true,
      message: `Document ${status === "APPROVED" ? "validé avec succès" : "rejeté"}.`,
      document: updatedDocument,
      newScore: scoreResult?.user.creditScore,
      newLimit: scoreResult?.user.creditLimit
    }, { status: 200 });

  } catch (error) {
    console.error("PUT /api/admin/kyc Error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la mise à jour du document KYC." }, { status: 500 });
  }
}
