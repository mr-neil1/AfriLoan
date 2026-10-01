import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin, verifyAdminPin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        creditLimit: true,
        availableCredit: true,
        creditScore: true,
        walletBalance: true,
        totalBorrowed: true,
        totalRepaid: true,
        mobileMoneyProvider: true,
        mobileMoneyNumber: true,
        currency: true,
        countryCode: true,
        city: true,
        address: true,
        latitude: true,
        longitude: true,
        googlePlaceId: true,
        profession: true,
        monthlyIncome: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRel: true,
        kycStatus: true,
        createdAt: true,
        _count: {
          select: { loans: true, kycDocuments: true, bankAccounts: true }
        },
        kycDocuments: {
          select: {
            id: true,
            documentType: true,
            mediaType: true,
            status: true,
            createdAt: true
          }
        },
        bankAccounts: {
          select: {
            id: true,
            bankName: true,
            accountNumber: true,
            status: true
          }
        }
      }
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/users Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { 
      userId, name, email, phone, role, 
      creditLimit, creditScore, availableCredit, walletBalance,
      countryCode, city, address, latitude, longitude,
      profession, monthlyIncome, emergencyContactName, emergencyContactPhone, emergencyContactRel,
      kycStatus, mobileMoneyProvider, mobileMoneyNumber, currency,
      pin, autoRecalculateScore
    } = body;

    if (!userId) {
      return NextResponse.json({ error: "ID utilisateur requis." }, { status: 400 });
    }

    if (creditLimit !== undefined || walletBalance !== undefined) {
      const isPinValid = await verifyAdminPin(admin, pin || "0000");
      if (!isPinValid) {
        return NextResponse.json({ error: "Code PIN requis pour modifier les paramètres financiers." }, { status: 403 });
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role !== undefined) updateData.role = role;
    if (currency !== undefined) updateData.currency = currency;
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude !== null ? Number(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude !== null ? Number(longitude) : null;
    if (profession !== undefined) updateData.profession = profession;
    if (monthlyIncome !== undefined) updateData.monthlyIncome = monthlyIncome !== null ? Number(monthlyIncome) : null;
    if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone;
    if (emergencyContactRel !== undefined) updateData.emergencyContactRel = emergencyContactRel;
    if (kycStatus !== undefined) updateData.kycStatus = kycStatus;
    if (mobileMoneyProvider !== undefined) updateData.mobileMoneyProvider = mobileMoneyProvider;
    if (mobileMoneyNumber !== undefined) updateData.mobileMoneyNumber = mobileMoneyNumber;
    if (creditLimit !== undefined) updateData.creditLimit = Number(creditLimit);
    if (creditScore !== undefined) updateData.creditScore = Number(creditScore);
    if (availableCredit !== undefined) updateData.availableCredit = Number(availableCredit);
    if (walletBalance !== undefined) updateData.walletBalance = Number(walletBalance);

    let user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    if (autoRecalculateScore) {
      const { recalculateUserScore } = await import("@/lib/creditScore");
      const res = await recalculateUserScore(userId, "Recalcul déclenché par l'administrateur");
      if (res?.user) user = res.user;
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/admin/users Error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}
