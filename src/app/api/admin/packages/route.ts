import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminAuth";

export async function GET(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const packages = await prisma.loanPackage.findMany({
      orderBy: { amount: "asc" }
    });

    return NextResponse.json({ packages }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/packages Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { admin, errorResponse } = await requireAdmin(req);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const { name, tier, amount, interestRate, durationDays, repaymentFrequency, description } = body;

    if (!name || !amount || !interestRate || !durationDays) {
      return NextResponse.json({ error: "Tous les champs obligatoires doivent être renseignés." }, { status: 400 });
    }

    const pkg = await prisma.loanPackage.create({
      data: {
        name,
        tier: tier || "Standard",
        amount: Number(amount),
        interestRate: Number(interestRate),
        durationDays: Number(durationDays),
        repaymentFrequency: repaymentFrequency || "MONTHLY",
        description: description || ""
      }
    });

    return NextResponse.json({ success: true, package: pkg }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/packages Error:", error);
    return NextResponse.json({ error: "Erreur lors de la création du forfait de prêt." }, { status: 500 });
  }
}
