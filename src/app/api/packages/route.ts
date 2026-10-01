import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let packages = await prisma.loanPackage.findMany({
      where: { isAvailable: true },
      orderBy: { amount: "asc" }
    });

    if (packages.length === 0) {
      // Auto-seed if empty
      const defaultLoanPackages = [
        {
          name: "Micro-Prêt Express",
          tier: "Basique",
          amount: 25000,
          interestRate: 5,
          durationDays: 15,
          repaymentFrequency: "IN_FINE",
          maxActivePerUser: 1,
          description: "Financement ultra-rapide pour régler une urgence ou un besoin immédiat."
        },
        {
          name: "Coup de Pouce",
          tier: "Basique",
          amount: 50000,
          interestRate: 6,
          durationDays: 21,
          repaymentFrequency: "WEEKLY",
          maxActivePerUser: 1,
          description: "Un appui flexible et rapide pour démarrer un petit projet ou financer des achats."
        },
        {
          name: "Relance Artisan & Commerce",
          tier: "Standard",
          amount: 100000,
          interestRate: 7.5,
          durationDays: 30,
          repaymentFrequency: "BIWEEKLY",
          maxActivePerUser: 2,
          description: "Idéal pour réapprovisionner votre stock ou booster votre activité commerciale."
        },
        {
          name: "Prêt Projet Pro",
          tier: "Standard",
          amount: 250000,
          interestRate: 8.5,
          durationDays: 45,
          repaymentFrequency: "MONTHLY",
          maxActivePerUser: 2,
          description: "Développez votre entreprise avec des mensualités souples et adaptées."
        },
        {
          name: "Expansion Business",
          tier: "Premium",
          amount: 500000,
          interestRate: 9.5,
          durationDays: 60,
          repaymentFrequency: "MONTHLY",
          maxActivePerUser: 3,
          description: "Pour les entrepreneurs établis qui souhaitent passer au niveau supérieur."
        },
        {
          name: "Grand Projet Vision",
          tier: "Premium",
          amount: 1000000,
          interestRate: 11,
          durationDays: 90,
          repaymentFrequency: "MONTHLY",
          maxActivePerUser: 3,
          description: "Financement d'envergure pour projets d'investissement, équipement et agrandissement."
        }
      ];

      for (const p of defaultLoanPackages) {
        await prisma.loanPackage.create({ data: p });
      }

      packages = await prisma.loanPackage.findMany({
        where: { isAvailable: true },
        orderBy: { amount: "asc" }
      });
    }

    return NextResponse.json({ packages }, { status: 200 });
  } catch (error) {
    console.error("GET /api/packages Error:", error);
    return NextResponse.json({ error: "Erreur serveur lors de la récupération des formules de prêt." }, { status: 500 });
  }
}
