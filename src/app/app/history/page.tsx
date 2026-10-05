"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, Clock, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getPaymentMethodVisual } from "@/lib/countriesData";
import { useSwrLocalCache } from "@/lib/storageCache";

export default function HistoryPage() {
  const [days, setDays] = useState<number>(30);
  const [filterType, setFilterType] = useState<string>("ALL");

  const fetchHistoryData = useCallback(async () => {
    const token = localStorage.getItem("afriloan_token");
    if (!token) return { history: [] };

    const res = await fetch(`/api/history?days=${days}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error("Erreur de chargement de l'historique");
    }
    const data = await res.json();
    return data;
  }, [days]);

  // SWR Cache: Instant zero-delay display from localStorage with background revalidation
  const {
    data,
    isLoading,
    isRevalidating
  } = useSwrLocalCache<any>({
    cacheKey: `user_history_cache_${days}`,
    fetcher: fetchHistoryData,
    ttlMs: 1000 * 60 * 15
  });

  const history = data?.history || [];

  const filteredHistory = history.filter((item: any) => {
    if (filterType === "ALL") return true;
    if (filterType === "DISBURSEMENT") return item.type === "LOAN_DISBURSEMENT";
    if (filterType === "REPAYMENT") return item.type === "REPAYMENT" || item.type === "LOAN_REPAYMENT";
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">Historique des Opérations</h1>
            {isRevalidating && (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Sync</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Déboursements reçus, remboursements effectués et activités financières.
          </p>
        </div>

        {/* Timeframe Selector */}
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#064E29] self-start sm:self-auto cursor-pointer"
        >
          <option value={7}>Derniers 7 jours</option>
          <option value={30}>Derniers 30 jours</option>
          <option value={90}>Derniers 90 jours</option>
        </select>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-200/60 p-1 rounded-2xl max-w-sm overflow-x-auto">
        <button
          onClick={() => setFilterType("ALL")}
          className={`flex-1 min-w-[70px] py-2 text-xs font-bold rounded-xl transition-all ${
            filterType === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilterType("DISBURSEMENT")}
          className={`flex-1 min-w-[90px] py-2 text-xs font-bold rounded-xl transition-all ${
            filterType === "DISBURSEMENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Prêts reçus
        </button>
        <button
          onClick={() => setFilterType("REPAYMENT")}
          className={`flex-1 min-w-[100px] py-2 text-xs font-bold rounded-xl transition-all ${
            filterType === "REPAYMENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Remboursements
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading && history.length === 0 ? (
          <div className="text-center py-16">
            <span className="loading loading-spinner loading-md text-[#064E29]"></span>
            <p className="text-xs text-slate-400 mt-2 font-medium">Chargement des opérations...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 p-6">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Aucune opération trouvée</p>
            <p className="text-xs text-slate-400 mt-1">Vos futures transactions apparaîtront ici.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item: any) => {
              const isDisbursed = item.type === "LOAN_DISBURSEMENT";
              const visual = getPaymentMethodVisual(item.description);

              return (
                <div key={item.id} className="p-3.5 sm:p-4.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    
                    {/* Brand Logo Avatar with Directional Badge */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-2xs overflow-hidden">
                        <img 
                          src={visual.logoUrl} 
                          alt={visual.displayName} 
                          className="w-full h-full object-contain" 
                        />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center border-2 border-white text-white shadow-xs ${
                        isDisbursed ? "bg-emerald-600" : "bg-amber-600"
                      }`}>
                        {isDisbursed ? <ArrowDownLeft className="w-2.5 h-2.5 stroke-[3]" /> : <ArrowUpRight className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-slate-900 truncate">
                        {item.description}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    {item.amount && (
                      <div className={`text-xs sm:text-sm font-black whitespace-nowrap ${isDisbursed ? "text-emerald-700" : "text-slate-900"}`}>
                        {isDisbursed ? "+" : "-"}{item.amount.toLocaleString("fr-FR")} FCFA
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 block mt-0.5">
                      {item.status || "VALIDÉ"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
