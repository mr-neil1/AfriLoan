"use client";

import { useEffect, useState } from "react";
import { ArrowDownLeft, CheckCircle2, Clock, Search, RefreshCw } from "lucide-react";

export default function AdminRepaymentsPage() {
  const [repayments, setRepayments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchRepayments();
  }, []);

  const fetchRepayments = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setRepayments(json.recentRepayments || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = repayments.filter(r => {
    const q = search.toLowerCase();
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.reference?.toLowerCase().includes(q) ||
      r.loan?.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Remboursements Reçus (Mobile Money)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Journal des paiements et règlements d'échéances effectués par les emprunteurs.
          </p>
        </div>

        <button
          onClick={fetchRepayments}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par emprunteur ou référence..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20">
            <span className="loading loading-spinner loading-md text-[#064E29]"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 p-6">
            <ArrowDownLeft className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Aucun remboursement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Emprunteur</th>
                  <th className="p-4">Prêt Associé</th>
                  <th className="p-4">Montant Remboursé</th>
                  <th className="p-4">Moyen de paiement</th>
                  <th className="p-4">Date de réception</th>
                  <th className="p-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{r.user?.name}</div>
                      <div className="text-[10px] text-slate-400">{r.user?.email}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {r.loan?.title || "Prêt AfriLoan"}
                    </td>
                    <td className="p-4 font-black text-emerald-700 text-sm">
                      +{r.amount.toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{r.paymentMethod}</div>
                      <div className="text-[10px] text-slate-400">{r.phoneNumber || r.reference}</div>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        {r.status || "COMPLETED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
