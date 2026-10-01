"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  CreditCard, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  ShieldCheck,
  RefreshCw
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import Link from "next/link";
import AdminPinModal from "@/components/admin/AdminPinModal";

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Quick Action Loan status update modal
  const [selectedLoanAction, setSelectedLoanAction] = useState<{ id: string; status: string } | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerLoanAction = (loanId: string, status: string) => {
    setSelectedLoanAction({ id: loanId, status });
    setIsPinModalOpen(true);
  };

  const executeLoanStatusChange = async (pin: string) => {
    if (!selectedLoanAction) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/loans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          loanId: selectedLoanAction.id,
          status: selectedLoanAction.status,
          pin
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Erreur de mise à jour");
      }

      setIsPinModalOpen(false);
      setSelectedLoanAction(null);
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
      </div>
    );
  }

  const { kpis, chartData, recentLoans, recentRepayments } = data || {};

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tableau de Bord Administrateur</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision globale des prêts, recouvrements et utilisateurs AfriLoan.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Disbursed */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Total Prêts Déboursés</span>
            <TrendingUp className="w-4 h-4 text-[#064E29]" />
          </div>
          <div className="text-2xl font-black text-[#064E29]">
            {kpis?.totalDisbursed?.toLocaleString("fr-FR") || 0}
            <span className="text-xs font-semibold text-slate-400 ml-1">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Capital accordé aux emprunteurs
          </div>
        </div>

        {/* Total Repaid */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Total Recouvert</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {kpis?.totalRepaid?.toLocaleString("fr-FR") || 0}
            <span className="text-xs font-semibold text-slate-400 ml-1">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Taux de recouvrement : <strong className="text-emerald-700">{kpis?.recoveryRate}%</strong>
          </div>
        </div>

        {/* Active & Overdue loans */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Prêts en cours</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis?.activeLoansCount || 0}
          </div>
          <div className="text-[11px] text-rose-600 font-bold mt-1">
            {kpis?.overdueLoansCount || 0} en retard d'échéance
          </div>
        </div>

        {/* Users */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2">
            <span>Emprunteurs inscrits</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {kpis?.totalUsers || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            +{kpis?.usersToday || 0} aujourd'hui
          </div>
        </div>

      </div>

      {/* Chart: Disbursements vs Repayments */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-slate-900">Flux Financiers (7 derniers jours)</h3>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-[#064E29]">
              <span className="w-3 h-3 rounded-full bg-[#064E29]"></span> Déboursements
            </span>
            <span className="flex items-center gap-1.5 text-amber-600">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Remboursements
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="disbursed" name="Déboursements" stroke="#064E29" fill="#064E29" fillOpacity={0.15} />
              <Area type="monotone" dataKey="repaid" name="Remboursements" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Loans Applications */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Dernières Demandes de Prêt</h3>
          <Link href="/admin/loans" className="text-xs font-bold text-[#064E29] hover:underline">
            Voir tous les prêts
          </Link>
        </div>

        {!recentLoans || recentLoans.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Aucun prêt récent.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Emprunteur</th>
                  <th className="p-3">Prêt</th>
                  <th className="p-3">Montant</th>
                  <th className="p-3">Durée</th>
                  <th className="p-3">Moyen Mobile</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 rounded-r-xl text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentLoans.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      <div>{l.user?.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{l.user?.phone || l.user?.email}</div>
                    </td>
                    <td className="p-3">{l.title}</td>
                    <td className="p-3 font-black text-[#064E29]">{l.amount.toLocaleString("fr-FR")} FCFA</td>
                    <td className="p-3">{l.durationDays}j</td>
                    <td className="p-3 font-semibold text-slate-800">{l.disbursementMethod}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        l.status === "REPAID" ? "bg-emerald-100 text-emerald-800" :
                        l.status === "ACTIVE" ? "bg-blue-100 text-blue-800" :
                        l.status === "OVERDUE" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {l.status === "PENDING" && (
                        <button
                          onClick={() => handleTriggerLoanAction(l.id, "DISBURSED")}
                          className="px-3 py-1 bg-[#064E29] text-white font-bold text-[10px] rounded-lg shadow-sm hover:opacity-95"
                        >
                          Débourser
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin PIN Validation Modal */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={executeLoanStatusChange}
        title="Validation de l'Opération de Prêt"
        description="Saisissez votre code PIN administrateur pour exécuter cette opération."
        isLoading={isUpdating}
      />

    </div>
  );
}
