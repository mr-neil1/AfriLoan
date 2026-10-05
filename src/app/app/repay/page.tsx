"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowUpRight, 
  CreditCard, 
  CheckCircle2, 
  Smartphone, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  Trophy,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import DepositPinModal from "@/components/deposit/DepositPinModal";
import { ALL_MOBILE_OPERATORS, getMobileMoneyLogo, getPaymentMethodVisual } from "@/lib/countriesData";
import { invalidateCachePattern } from "@/lib/storageCache";

function RepayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoanId, setSelectedLoanId] = useState<string>("");
  const [repayMode, setRepayMode] = useState<"installment" | "full" | "custom">("installment");
  const [customRepayAmount, setCustomRepayAmount] = useState<number>(10000);

  const [paymentMethod, setPaymentMethod] = useState<string>("ORANGE_MONEY");
  const [phoneNumber, setPhoneNumber] = useState<string>("");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // PIN modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const fetchActiveLoans = async () => {
    try {
      const token = localStorage.getItem("afriloan_token");
      if (!token) return router.replace("/auth");

      const [loansRes, meRes] = await Promise.all([
        fetch("/api/loans", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (loansRes.ok) {
        const data = await loansRes.json();
        const active = (data.loans || []).filter((l: any) => l.remainingAmount > 0 && ["ACTIVE", "OVERDUE", "DISBURSED"].includes(l.status));
        setLoans(active);

        const paramLoanId = searchParams.get("loanId");
        if (paramLoanId && active.some((l: any) => l.id === paramLoanId)) {
          setSelectedLoanId(paramLoanId);
        } else if (active.length > 0) {
          setSelectedLoanId(active[0].id);
        }
      }

      if (meRes.ok) {
        const meData = await meRes.json();
        if (meData.user.mobileMoneyProvider) setPaymentMethod(meData.user.mobileMoneyProvider);
        if (meData.user.mobileMoneyNumber) setPhoneNumber(meData.user.mobileMoneyNumber);
      }
    } catch (e) {
      // ignore
    }
  };

  const selectedLoan = loans.find(l => l.id === selectedLoanId);

  // Calculate amount to pay
  let effectiveAmount = 0;
  if (selectedLoan) {
    if (repayMode === "installment") {
      effectiveAmount = selectedLoan.nextDueAmount || selectedLoan.remainingAmount;
    } else if (repayMode === "full") {
      effectiveAmount = selectedLoan.remainingAmount;
    } else {
      effectiveAmount = customRepayAmount;
    }
  }

  const handleStartRepayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedLoan) {
      return setError("Veuillez sélectionner un prêt à rembourser.");
    }
    if (!effectiveAmount || effectiveAmount <= 0) {
      return setError("Montant invalide.");
    }
    if (effectiveAmount > selectedLoan.remainingAmount) {
      return setError(`Le montant ne peut pas dépasser le reste dû (${selectedLoan.remainingAmount.toLocaleString("fr-FR")} FCFA).`);
    }

    // Open Mobile Money PIN confirmation modal
    setIsPinModalOpen(true);
  };

  const executeRepayment = async (pin: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/repay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          loanId: selectedLoan.id,
          amount: effectiveAmount,
          paymentMethod,
          phoneNumber,
          notes: `Remboursement via ${paymentMethod} (${phoneNumber})`
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec du remboursement.");
      }

      setIsPinModalOpen(false);
      setSuccessData(data);
      setIsSuccess(true);

      // Invalidate caches so loans, stats, and dashboard update in background
      invalidateCachePattern("user_");
      invalidateCachePattern("dashboard");
      invalidateCachePattern("loans");
      invalidateCachePattern("history");
    } catch (err: any) {
      setError(err.message);
      setIsPinModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess && successData) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 sm:p-10 rounded-3xl border border-emerald-100 shadow-xl text-center space-y-6 animate-fadeIn my-8">
        <div className="w-16 h-16 bg-emerald-100 text-[#064E29] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>

        <h2 className="text-2xl font-black text-slate-900">
          {successData.isFullyRepaid ? "Félicitations ! Prêt 100% remboursé 🎉" : "Remboursement Validé !"}
        </h2>

        <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Votre versement de <strong className="text-[#064E29]">{effectiveAmount.toLocaleString("fr-FR")} FCFA</strong> via <strong>{paymentMethod}</strong> a été débité et comptabilisé avec succès.
        </p>

        {successData.isFullyRepaid ? (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs font-semibold">
            ⭐ Votre excellente ponctualité a augmenté votre limite de crédit disponible et votre score de solvabilité !
          </div>
        ) : (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs flex justify-between font-bold text-slate-700">
            <span>Reste à rembourser :</span>
            <span className="text-[#064E29] font-black">{successData.remainingAmount.toLocaleString("fr-FR")} FCFA</span>
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/app/loans"
            className="flex-1 py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white font-bold text-xs rounded-xl shadow-md text-center"
          >
            Voir mes prêts
          </Link>
          <Link
            href="/app"
            className="flex-1 py-3.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 text-center"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Remboursement de Prêt</h1>
        <p className="text-xs text-slate-500 mt-1">
          Effectuez vos versements en toute sécurité depuis votre compte Mobile Money.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {loans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Vous n'avez aucun prêt à rembourser</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Tous vos financements sont en règle. Vous disposez d'un crédit disponible prêt à être déboursé.
          </p>
          <Link
            href="/app/apply"
            className="px-6 py-3 bg-[#064E29] text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
          >
            <span>Demander un nouveau prêt</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleStartRepayment} className="space-y-6">
          
          {/* LOAN SELECTOR */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Sélectionnez le prêt à rembourser
            </h3>

            <div className="space-y-2.5">
              {loans.map((loan) => {
                const isSelected = selectedLoanId === loan.id;
                return (
                  <div
                    key={loan.id}
                    onClick={() => setSelectedLoanId(loan.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? "border-[#064E29] bg-emerald-50/50 shadow-sm"
                        : "border-slate-100 bg-slate-50 hover:border-slate-200"
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-slate-900 text-sm">{loan.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Total dû : {loan.totalToRepay.toLocaleString("fr-FR")} FCFA • Échéance : {new Date(loan.dueDate).toLocaleDateString("fr-FR")}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-slate-400">Reste à payer</div>
                      <div className="text-base font-black text-[#064E29]">
                        {loan.remainingAmount.toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* REPAYMENT AMOUNT TYPE */}
          {selectedLoan && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Montant du versement
              </h3>

              <div className="grid sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setRepayMode("installment")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    repayMode === "installment"
                      ? "border-[#064E29] bg-emerald-50 text-[#064E29] font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-xs text-slate-500">Prochaine échéance</div>
                  <div className="text-lg font-black text-[#064E29] mt-1">
                    {(selectedLoan.nextDueAmount || selectedLoan.remainingAmount).toLocaleString("fr-FR")} FCFA
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRepayMode("full")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    repayMode === "full"
                      ? "border-amber-500 bg-amber-50 text-amber-900 font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-xs text-slate-500">Solde intégral</div>
                  <div className="text-lg font-black text-amber-600 mt-1">
                    {selectedLoan.remainingAmount.toLocaleString("fr-FR")} FCFA
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRepayMode("custom")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    repayMode === "custom"
                      ? "border-slate-900 bg-slate-900 text-white font-bold"
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-xs text-slate-400">Montant libre</div>
                  <div className="text-sm font-extrabold mt-1">
                    Personnaliser
                  </div>
                </button>
              </div>

              {repayMode === "custom" && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Montant personnalisé (FCFA)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={selectedLoan.remainingAmount}
                    value={customRepayAmount}
                    onChange={(e) => setCustomRepayAmount(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black focus:outline-none focus:border-[#064E29]"
                  />
                </div>
              )}
            </div>
          )}

          {/* MOBILE MONEY OPERATOR SELECTOR */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Moyen de paiement Mobile Money
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {ALL_MOBILE_OPERATORS.map((op) => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setPaymentMethod(op.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 group cursor-pointer ${
                    paymentMethod === op.id
                      ? "border-[#064E29] bg-emerald-50 text-[#064E29] font-bold shadow-sm ring-2 ring-[#064E29]/20"
                      : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs overflow-hidden group-hover:scale-105 transition-transform">
                    <img src={op.logoUrl} alt={op.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] font-extrabold leading-tight">{op.name}</span>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro de débit {paymentMethod}
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: +225 07 00 00 00 00"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
              />
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isLoading || !selectedLoan || effectiveAmount <= 0}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-amber-600/20 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer active:scale-98"
          >
            <div className="w-6 h-6 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img src={getMobileMoneyLogo(paymentMethod)} alt="" className="w-full h-full object-contain" />
            </div>
            <span>Payer {effectiveAmount.toLocaleString("fr-FR")} FCFA par {paymentMethod}</span>
            <ArrowRight className="w-5 h-5 text-slate-950" />
          </button>

        </form>
      )}

      {/* PIN Confirmation Modal */}
      {selectedLoan && (
        <DepositPinModal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          onConfirm={executeRepayment}
          amount={effectiveAmount}
          currencySymbol="FCFA"
          methodName={paymentMethod}
          phone={phoneNumber}
          isLoading={isLoading}
        />
      )}

    </div>
  );
}

export default function RepayPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <RepayContent />
    </Suspense>
  );
}
