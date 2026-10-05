"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Smartphone,
  MessageCircle
} from "lucide-react";
import LoanStatusModal from "@/components/loans/LoanStatusModal";
import { getMobileMoneyLogo, getPaymentMethodVisual } from "@/lib/countriesData";
import { useSwrLocalCache } from "@/lib/storageCache";
import { useCustomerSupport, buildWhatsAppMessageLink } from "@/lib/support";

export default function LoansPage() {
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null);
  const [selectedLoanForStatus, setSelectedLoanForStatus] = useState<any | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const { support } = useCustomerSupport();

  // Fetcher for loans list
  const fetchLoansData = async () => {
    const token = localStorage.getItem("afriloan_token");
    if (!token) return { loans: [] };

    const res = await fetch("/api/loans", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error("Erreur de chargement des prêts");
    }
    return await res.json();
  };

  // Instant SWR cache load from localStorage with background revalidation
  const {
    data,
    isLoading,
    isRevalidating,
    refresh: fetchLoans
  } = useSwrLocalCache<any>({
    cacheKey: "user_loans_cache",
    fetcher: fetchLoansData,
    ttlMs: 1000 * 60 * 15,
    onSuccess: (freshData) => {
      if (freshData?.loans?.length > 0 && !expandedLoanId) {
        setExpandedLoanId(freshData.loans[0].id);
      }
    }
  });

  const loans = data?.loans || [];

  const filteredLoans = loans.filter((l: any) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") return ["PENDING", "APPROVED"].includes(l.status);
    if (filter === "ACTIVE") return ["ACTIVE", "OVERDUE", "DISBURSED"].includes(l.status);
    if (filter === "REPAID") return l.status === "REPAID";
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Mes Prêts & Échéanciers</h1>
            {isRevalidating && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Sync</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos financements en cours, consultez vos échéances et effectuez vos remboursements.
          </p>
        </div>

        <Link
          href="/app/apply"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>Nouveau prêt</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-200/60 p-1 rounded-2xl max-w-md overflow-x-auto">
        <button
          onClick={() => setFilter("ALL")}
          className={`flex-1 min-w-[70px] py-2 text-xs font-bold rounded-xl transition-all ${
            filter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Tous ({loans.length})
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`flex-1 min-w-[90px] py-2 text-xs font-bold rounded-xl transition-all ${
            filter === "PENDING" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          En attente ({loans.filter((l: any) => ["PENDING", "APPROVED"].includes(l.status)).length})
        </button>
        <button
          onClick={() => setFilter("ACTIVE")}
          className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-xl transition-all ${
            filter === "ACTIVE" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          En cours ({loans.filter((l: any) => ["ACTIVE", "OVERDUE", "DISBURSED"].includes(l.status)).length})
        </button>
        <button
          onClick={() => setFilter("REPAID")}
          className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-xl transition-all ${
            filter === "REPAID" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Remboursés ({loans.filter((l: any) => l.status === "REPAID").length})
        </button>
      </div>

      {/* Loans List */}
      {isLoading ? (
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-md text-[#064E29]"></span>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">Aucun prêt trouvé</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Vous n'avez aucun prêt dans cette catégorie. Vous pouvez demander un financement à tout moment.
          </p>
          <Link
            href="/app/apply"
            className="px-6 py-3 bg-[#064E29] text-white font-bold text-xs rounded-xl shadow-md inline-flex items-center gap-2"
          >
            <span>Faire une demande de prêt</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLoans.map((loan: any) => {
            const isExpanded = expandedLoanId === loan.id;
            const progress = Math.min(100, Math.round((loan.repaidAmount / loan.totalToRepay) * 100));

            return (
              <div 
                key={loan.id} 
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all"
              >
                {/* Loan Summary Header */}
                <div 
                  onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                  className="p-5 sm:p-6 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#064E29] flex items-center justify-center shrink-0 border border-emerald-100">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-slate-900 text-base">{loan.title}</h3>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          loan.status === "REPAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : loan.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {loan.status === "REPAID" ? "Remboursé à 100%" : loan.status === "OVERDUE" ? "En retard" : "En cours"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Capital : <strong className="text-slate-800">{loan.amount.toLocaleString("fr-FR")} FCFA</strong> • Taux : {loan.interestRate}% • Durée : {loan.durationDays} jours
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-400">Reste dû</div>
                      <div className="text-lg font-black text-[#064E29]">
                        {loan.remainingAmount.toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>

                    <button className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details & Installments Schedule */}
                {isExpanded && (
                  <div className="p-6 bg-slate-50/80 border-t border-slate-100 space-y-6">
                    
                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-slate-600">
                        <span>Remboursé : {loan.repaidAmount.toLocaleString("fr-FR")} FCFA</span>
                        <span>Total : {loan.totalToRepay.toLocaleString("fr-FR")} FCFA ({progress}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-[#064E29] to-emerald-500 h-2.5 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Date d'octroi</span>
                        <span className="font-bold text-slate-800">{new Date(loan.startDate).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Échéance finale</span>
                        <span className="font-bold text-slate-800">{new Date(loan.dueDate).toLocaleDateString("fr-FR")}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-0.5">Moyen de réception</span>
                        <span className="font-bold text-[#064E29] flex items-center gap-1.5">
                          <img 
                            src={getMobileMoneyLogo(loan.disbursementMethod)} 
                            alt="" 
                            className="w-4 h-4 rounded object-contain bg-white p-0.5 border border-slate-200 shrink-0" 
                          />
                          <span className="truncate">{loan.disbursementMethod || "Mobile Money"}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Numéro associé</span>
                        <span className="font-bold text-slate-800">{loan.disbursementPhone || "Compte lié"}</span>
                      </div>
                    </div>

                    {/* Installments Table */}
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                        Tableau d'amortissement & Échéances ({loan.installments.length} tranches)
                      </h4>

                      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100 text-xs">
                        {loan.installments.map((inst: any) => (
                          <div key={inst.id} className="p-3.5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                                {inst.installmentNumber}
                              </span>
                              <div>
                                <div className="font-bold text-slate-800">
                                  {inst.amount.toLocaleString("fr-FR")} FCFA
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Date limite : {new Date(inst.dueDate).toLocaleDateString("fr-FR")}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                inst.status === "PAID" 
                                  ? "bg-emerald-100 text-emerald-800" 
                                  : "bg-amber-100 text-amber-800"
                              }`}>
                                {inst.status === "PAID" ? "Payé" : "En attente"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {["PENDING", "APPROVED"].includes(loan.status) ? (
                      <div className="pt-3 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs text-amber-800 font-bold flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
                          <span>Demande en cours d'étude par le comité financier</span>
                        </span>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLoanForStatus(loan);
                              setIsStatusModalOpen(true);
                            }}
                            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Vérifier l'état</span>
                          </button>

                          <a
                            href={buildWhatsAppMessageLink(
                              support.whatsappUrl,
                              `Bonjour ${support.agentName ? support.agentName : "Service Client AfriLoan"}, je souhaite faire le point sur ma demande de prêt ${loan.title} d'un montant de ${(loan.amount || 0).toLocaleString("fr-FR")} FCFA (Dossier N° AFL-${loan.id?.slice(-6).toUpperCase()}).`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{support.isDedicatedAgent ? `Contacter ${support.agentName}` : "Contacter le service client"}</span>
                          </a>
                        </div>
                      </div>
                    ) : loan.remainingAmount > 0 ? (
                      <div className="pt-2 flex justify-end">
                        <Link
                          href={`/app/repay?loanId=${loan.id}`}
                          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-2"
                        >
                          <span>Effectuer un remboursement</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : null}

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Loan Status Verification & Support Modal */}
      <LoanStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        loan={selectedLoanForStatus}
        onRefresh={fetchLoans}
      />

    </div>
  );
}
