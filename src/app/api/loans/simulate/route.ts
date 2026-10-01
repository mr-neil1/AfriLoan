import { NextResponse } from "next/server";
import { calculateLoanTerms } from "@/lib/loans";

export async function POST(req: Request) {
  try {
    const { amount, durationDays, interestRate } = await req.json();

    const cleanAmount = Number(amount);
    const cleanDuration = Number(durationDays);
    const cleanRate = interestRate ? Number(interestRate) : undefined;

    if (!cleanAmount || cleanAmount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    if (!cleanDuration || cleanDuration <= 0) {
      return NextResponse.json({ error: "Durée invalide" }, { status: 400 });
    }

    const terms = calculateLoanTerms(cleanAmount, cleanDuration, cleanRate);

    return NextResponse.json({ terms }, { status: 200 });
  } catch (error) {
    console.error("Simulation error:", error);
    return NextResponse.json({ error: "Erreur lors de la simulation" }, { status: 500 });
  }
}
