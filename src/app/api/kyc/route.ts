import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { evaluateUserCriteria, recalculateUserScore } from "@/lib/creditScore";

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

    const [user, documents, bankAccounts, repaidLoansCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          countryCode: true,
          city: true,
          address: true,
          latitude: true,
          longitude: true,
          profession: true,
          monthlyIncome: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyContactRel: true,
          creditScore: true,
          creditLimit: true,
          kycStatus: true,
        }
      }),
      prisma.kycDocument.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" }
      }),
      prisma.userBankAccount.findMany({
        where: { userId }
      }),
      prisma.loan.count({
        where: { userId, status: "REPAID" }
      })
    ]);

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const breakdown = evaluateUserCriteria(user, documents, bankAccounts, repaidLoansCount);

    return NextResponse.json({
      success: true,
      kycStatus: user.kycStatus,
      documents,
      breakdown
    }, { status: 200 });

  } catch (error) {
    console.error("GET /api/kyc Error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération des données KYC" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = authenticateUser(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { documentType, mediaType = "IMAGE", fileData, captureSource = "UPLOAD" } = body;

    if (!documentType || !fileData) {
      return NextResponse.json({ error: "Type de document et fichier requis" }, { status: 400 });
    }

    // Vérifier si un document de ce type existe déjà
    const existing = await prisma.kycDocument.findFirst({
      where: { userId, documentType }
    });

    let document: any;
    if (existing) {
      document = await prisma.kycDocument.update({
        where: { id: existing.id },
        data: {
          mediaType,
          fileData,
          captureSource,
          status: "PENDING",
          adminNote: null,
          reviewedAt: null,
          reviewedBy: null,
          createdAt: new Date()
        }
      });
    } else {
      document = await prisma.kycDocument.create({
        data: {
          userId,
          documentType,
          mediaType,
          fileData,
          captureSource,
          status: "PENDING"
        }
      });
    }

    // Mettre à jour le statut global KYC de l'utilisateur à PENDING si pas encore VERIFIED
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: "PENDING"
      }
    });

    // Journaliser l'activité
    await prisma.activity.create({
      data: {
        userId,
        type: "KYC_SUBMITTED",
        description: `Nouveau document de vérification transmis : ${documentType} (${captureSource})`
      }
    });

    // Recalculer le score dynamique
    const scoreResult = await recalculateUserScore(userId, `Transmission document KYC: ${documentType}`);

    return NextResponse.json({
      success: true,
      message: "Document KYC transmis avec succès. En cours d'analyse.",
      document,
      breakdown: scoreResult?.breakdown,
      newScore: scoreResult?.user.creditScore
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/kyc Error:", error);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement du document KYC" }, { status: 500 });
  }
}
