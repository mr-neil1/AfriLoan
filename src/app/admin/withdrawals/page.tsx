"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Search, RefreshCw, Smartphone } from "lucide-react";

export default function AdminWithdrawalsPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDisbursements();
  }, []);

  const fetchDisbursements = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch("/api/admin/loans?status=ALL", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        const disbursed = (json.loans || []).filter((l: any) => ["ACTIVE", "DISBURSED", "REPAID", "OVERDUE"].includes(l.status));
        setLoans(disbursed);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = loans.filter(l => {
    const q = search.toLowerCase();
    return (
      l.user?.name?.toLowerCase().includes(q) ||
      l.user?.email?.toLowerCase().includes(q) ||
      l.user?.phone?.toLowerCase().includes(q) ||
      l.disbursementReference?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Déboursements Effectués (Mobile Money)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique des crédits transférés directement sur les comptes des emprunteurs.
          </p>
        </div>

        <button
          onClick={fetchDisbursements}
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
            <ArrowUpRight className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Aucun déboursement trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Bénéficiaire</th>
                  <th className="p-4">Dossier</th>
                  <th className="p-4">Montant Déboursé</th>
                  <th className="p-4">Opérateur Mobile</th>
                  <th className="p-4">Numéro Crédité</th>
                  <th className="p-4">Date de virement</th>
                  <th className="p-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{l.user?.name}</div>
                      <div className="text-[10px] text-slate-400">{l.user?.email}</div>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {l.title}
                    </td>
                    <td className="p-4 font-black text-[#064E29] text-sm">
                      {l.amount.toLocaleString("fr-FR")} FCFA
                    </td>
                    <td className="p-4 font-bold text-slate-900">
                      {l.disbursementMethod}
                    </td>
                    <td className="p-4 font-mono font-semibold">
                      {l.disbursementPhone || l.user?.phone}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(l.disbursedAt || l.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-4 text-right">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                        DÉBOURSÉ
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
