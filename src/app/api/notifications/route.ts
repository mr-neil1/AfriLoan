import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

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

    const notifications = await prisma.notification.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error("GET /api/notifications Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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

    const { id } = await req.json();

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: decoded.userId },
        data: { isRead: true }
      });
    } else {
      // Mark all as read
      await prisma.notification.updateMany({
        where: { userId: decoded.userId, isRead: false },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/notifications Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
