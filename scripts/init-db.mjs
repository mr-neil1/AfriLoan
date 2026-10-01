import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("=== [AFRILOAN] Initialisation de la Base de Données Dédiée ===");

  // 1. Exécuter 'prisma db push'
  try {
    console.log("-> Synchronisation du schéma Prisma AfriLoan...");
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
    console.log("-> Schéma AfriLoan synchronisé avec succès !");
  } catch (err) {
    console.warn("⚠️ Avertissement lors de 'prisma db push':", err.message);
  }

  // 2. Vérification et initialisation des packages de prêt fixes par défaut
  const prisma = new PrismaClient();
  try {
    const pkgCount = await prisma.loanPackage.count();
    console.log(`-> Nombre actuel de formules de prêt en base: ${pkgCount}`);

    if (pkgCount === 0) {
      console.log("-> Création des forfaits de prêt AfriLoan par défaut...");
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
        },
        {
          name: "Élite Entrepreneur",
          tier: "Business",
          amount: 2000000,
          interestRate: 12,
          durationDays: 120,
          repaymentFrequency: "MONTHLY",
          maxActivePerUser: 5,
          description: "La solution de crédit ultime pour les dirigeants et grandes opportunités commerciales."
        }
      ];

      for (const pkg of defaultLoanPackages) {
        await prisma.loanPackage.create({ data: pkg });
      }
      console.log(`-> ${defaultLoanPackages.length} formules de prêt créées avec succès !`);
    }
  } catch (dbErr) {
    console.warn("⚠️ Note lors de la vérification des packages:", dbErr.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log("=== Fin de l'initialisation de la Base de Données AfriLoan ===");
}

main().catch((err) => {
  console.warn("Script init-db terminé avec avertissement:", err.message);
});
