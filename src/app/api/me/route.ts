import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { syncUserLoans } from "@/lib/loans";

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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        currency: true,
        language: true,
        referralCode: true,
        creditLimit: true,
        creditScore: true,
        availableCredit: true,
        walletBalance: true,
        totalBorrowed: true,
        totalRepaid: true,
        mobileMoneyProvider: true,
        mobileMoneyNumber: true,
        isVerified: true,
        authProvider: true,
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
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const adminEmail = process.env.ADMIN_EMAIL || "admin@afriloan.com";
    if (user.email.toLowerCase() === adminEmail.toLowerCase() && user.role !== "ADMIN") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" }
      });
      user.role = "ADMIN";
    }

    return NextResponse.json({ user }, { status: 200 });

  } catch (error) {
    console.error("GET /api/me Error:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération du profil." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const body = await req.json();
    const { 
      name, email, phone, mobileMoneyProvider, mobileMoneyNumber, currency, language, 
      currentPassword, newPassword, newPin,
      profession, monthlyIncome, emergencyContactName, emergencyContactPhone, emergencyContactRel,
      countryCode, city, address, latitude, longitude, googlePlaceId
    } = body;

    const updateData: any = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (mobileMoneyProvider) updateData.mobileMoneyProvider = mobileMoneyProvider;
    if (mobileMoneyNumber) updateData.mobileMoneyNumber = mobileMoneyNumber;
    if (currency) updateData.currency = currency;
    if (language) updateData.language = language;
    if (profession !== undefined) updateData.profession = profession;
    if (monthlyIncome !== undefined) updateData.monthlyIncome = Number(monthlyIncome) || null;
    if (emergencyContactName !== undefined) updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) updateData.emergencyContactPhone = emergencyContactPhone;
    if (emergencyContactRel !== undefined) updateData.emergencyContactRel = emergencyContactRel;
    if (countryCode !== undefined) updateData.countryCode = countryCode;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude !== null ? Number(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude !== null ? Number(longitude) : null;
    if (googlePlaceId !== undefined) updateData.googlePlaceId = googlePlaceId;

    const isSensitiveUpdate = email || newPassword || newPin;

    if (isSensitiveUpdate && user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Mot de passe actuel requis pour modifier ces informations." }, { status: 400 });
      }
      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
      }
    }

    if (email && email !== user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return NextResponse.json({ error: "Cet email est déjà utilisé." }, { status: 400 });
      }
      updateData.email = email;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Le mot de passe doit comporter au moins 6 caractères." }, { status: 400 });
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (newPin) {
      if (typeof newPin !== "string" || newPin.length !== 4 || isNaN(Number(newPin))) {
        return NextResponse.json({ error: "Le code PIN doit comporter 4 chiffres." }, { status: 400 });
      }
      updateData.pinCodeHash = await bcrypt.hash(newPin, 10);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });

    // Recalculer le score dynamiquement
    const { recalculateUserScore } = await import("@/lib/creditScore");
    const scoreResult = await recalculateUserScore(user.id, "Mise à jour des informations de profil");

    const updatedUser = scoreResult?.user || await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        currency: true,
        language: true,
        creditLimit: true,
        availableCredit: true,
        creditScore: true,
        mobileMoneyProvider: true,
        mobileMoneyNumber: true,
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
        kycStatus: true,
        isVerified: true,
        authProvider: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      scoreBreakdown: scoreResult?.breakdown 
    }, { status: 200 });

  } catch (error) {
    console.error("PUT /api/me Error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du profil." }, { status: 500 });
  }
}
