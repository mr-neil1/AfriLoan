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

export async function POST(req: Request) {
  try {
    const userId = authenticateUser(req);
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { address, city, countryCode, latitude, longitude, googlePlaceId } = body;

    if (!address && !latitude && !city) {
      return NextResponse.json({ error: "Veuillez renseigner une adresse ou des coordonnées géographiques." }, { status: 400 });
    }

    const updateData: any = {};
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (countryCode !== undefined) updateData.countryCode = countryCode.toUpperCase();
    if (latitude !== undefined) updateData.latitude = latitude !== null ? Number(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude !== null ? Number(longitude) : null;
    if (googlePlaceId !== undefined) updateData.googlePlaceId = googlePlaceId;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        address: true,
        city: true,
        countryCode: true,
        latitude: true,
        longitude: true,
        googlePlaceId: true,
        creditScore: true,
        creditLimit: true
      }
    });

    // Journaliser l'activité
    await prisma.activity.create({
      data: {
        userId,
        type: "LOCATION_VERIFIED",
        description: `Localisation du domicile enregistrée : ${city || ""}, ${address || "Coordonnées GPS"}`
      }
    });

    // Recalculer le score dynamique (+100 pts pour domicile localisé)
    const scoreResult = await recalculateUserScore(userId, "Localisation du domicile validée (+100 pts)");

    return NextResponse.json({
      success: true,
      message: "Localisation du domicile enregistrée avec succès !",
      location: {
        address: user.address,
        city: user.city,
        countryCode: user.countryCode,
        latitude: user.latitude,
        longitude: user.longitude,
      },
      scoreBreakdown: scoreResult?.breakdown,
      newScore: scoreResult?.user.creditScore,
      newLimit: scoreResult?.user.creditLimit
    }, { status: 200 });

  } catch (error) {
    console.error("POST /api/location Error:", error);
    return NextResponse.json({ error: "Erreur lors de la sauvegarde de la localisation" }, { status: 500 });
  }
}
