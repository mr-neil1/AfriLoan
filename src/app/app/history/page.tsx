"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Clock, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [days, setDays] = useState<number>(30);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [days]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch(`/api/history?days=${days}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHistory = history.filter(item => {
    if (filterType === "ALL") return true;
    if (filterType === "DISBURSEMENT") return item.type === "LOAN_DISBURSEMENT";
    if (filterType === "REPAYMENT") return item.type === "REPAYMENT" || item.type === "LOAN_REPAYMENT";
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Historique des Opérations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Déboursements reçus, remboursements effectués et activités financières.
          </p>
        </div>

        {/* Timeframe Selector */}
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
        >
          <option value={7}>Derniers 7 jours</option>
          <option value={30}>Derniers 30 jours</option>
          <option value={90}>Derniers 90 jours</option>
        </select>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-slate-200/60 p-1 rounded-2xl max-w-sm">
        <button
          onClick={() => setFilterType("ALL")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filterType === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilterType("DISBURSEMENT")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filterType === "DISBURSEMENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Prêts reçus
        </button>
        <button
          onClick={() => setFilterType("REPAYMENT")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            filterType === "REPAYMENT" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Remboursements
        </button>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16">
            <span className="loading loading-spinner loading-md text-[#064E29]"></span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-16 p-6">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Aucune opération trouvée</p>
            <p className="text-xs text-slate-400 mt-1">Vos futures transactions apparaîtront ici.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredHistory.map((item) => {
              const isDisbursed = item.type === "LOAN_DISBURSEMENT";
              return (
                <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isDisbursed ? "bg-emerald-100 text-[#064E29]" : "bg-amber-100 text-amber-800"
                    }`}>
                      {isDisbursed ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {item.description}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {item.amount && (
                      <div className={`text-sm font-black ${isDisbursed ? "text-emerald-700" : "text-slate-900"}`}>
                        {isDisbursed ? "+" : "-"}{item.amount.toLocaleString("fr-FR")} FCFA
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-400">
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
