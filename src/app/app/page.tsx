"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  PlusCircle, 
  ArrowUpRight, 
  Smartphone, 
  Bell, 
  ShieldCheck, 
  ChevronRight,
  ArrowRight,
  Info,
  MessageCircle
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import LoanStatusModal from "@/components/loans/LoanStatusModal";
import { getMobileMoneyLogo, getPaymentMethodVisual } from "@/lib/countriesData";
import { useSwrLocalCache } from "@/lib/storageCache";

export default function DashboardPage() {
  const [selectedLoanForStatus, setSelectedLoanForStatus] = useState<any | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Fetcher for dashboard data with auth check
  const fetchDashboardData = async () => {
    const token = localStorage.getItem("afriloan_token");
    if (!token) {
      window.location.href = "/auth";
      throw new Error("Non authentifié");
    }

    const res = await fetch("/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error("Erreur de chargement du tableau de bord");
    }

    return await res.json();
  };

  // Stale-While-Revalidate: Instant render from localStorage, syncs with DB in background!
  const {
    data,
    isLoading,
    isRevalidating,
    error,
    refresh: fetchDashboard,
    mutate
  } = useSwrLocalCache<any>({
    cacheKey: "user_dashboard_cache",
    fetcher: fetchDashboardData,
    ttlMs: 1000 * 60 * 15 // 15 minutes TTL
  });

  const markNotificationRead = async (id: string) => {
    try {
      const token = localStorage.getItem("afriloan_token");
      await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      fetchDashboard();
    } catch (e) {
      // ignore
    }
  };

  if (isLoading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
        <p className="text-xs font-semibold text-slate-500">Chargement de votre espace sécurisé AfriLoan...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-800 rounded-3xl max-w-md mx-auto text-center mt-12">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
        <h3 className="font-bold text-base mb-1">Impossible de charger les données</h3>
        <p className="text-xs text-rose-600 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-5 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm hover:bg-rose-700 cursor-pointer"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const { user, stats, activeLoans, notifications, recentHistory, chartData } = data;
  const nextDue = stats?.nextUpcomingDue;

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Welcome & Credit Score Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="text-xs text-slate-500 font-semibold mb-1">
            Espace Emprunteur Sécurisé
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Bonjour, {user.name} 👋
          </h1>
          <div className="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
            <span>Opérateur :</span>
            <span className="inline-flex items-center gap-1.5 font-extrabold text-[#064E29] bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 shadow-xs">
              <img 
                src={getMobileMoneyLogo(user.mobileMoneyProvider)} 
                alt="" 
                className="w-4 h-4 rounded-md object-contain bg-white p-0.5 border border-slate-200" 
              />
              <span>{user.mobileMoneyProvider || "Orange Money"}</span>
            </span>
            <span className="text-slate-400 font-mono text-[11px]">({user.mobileMoneyNumber || "Non configuré"})</span>
          </div>
        </div>

        {/* Credit Score Badge */}
        {/* Credit Score Badge */}
        <Link 
          href="/app/kyc"
          className="flex items-center gap-3 bg-emerald-50/80 hover:bg-emerald-100/80 border border-emerald-200/60 p-3 rounded-2xl transition-all group"
          title="Consulter et améliorer mon score de solvabilité"
        >
          <div className="w-10 h-10 rounded-xl bg-[#064E29] text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
            {user.creditScore}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-800 flex items-center gap-1">
              <span>Score Solvabilité</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-xs font-bold text-[#064E29]">
              {user.creditScore >= 700 ? "Excellente réputation" : user.creditScore >= 350 ? "Profil standard" : "Départ (À compléter)"}
            </div>
          </div>
        </Link>
      </div>

      {/* KYC Boost & Verification Banner */}
      {user.kycStatus !== "VERIFIED" && (
        <div className="bg-gradient-to-r from-emerald-950 via-[#064E29] to-[#0A5C36] text-white p-5 rounded-3xl shadow-lg shadow-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-400">
                Plafond Évolutif & Sécurité
              </div>
              <div className="text-base font-black text-white">
                Votre score actuel est de {user.creditScore}/1000 (Plafond : {user.creditLimit?.toLocaleString("fr-FR")} FCFA)
              </div>
              <div className="text-xs text-emerald-100/80">
                Prenez votre CNI en photo, enregistrez votre vidéo KYC et liez votre banque pour débloquer jusqu'à 2 000 000 FCFA.
              </div>
            </div>
          </div>

          <Link
            href="/app/kyc"
            className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <span>Augmenter mon score</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* AUTOMATIC DUE DATE ALERT BANNER (If loan has pending due date) */}
      {nextDue && nextDue.date && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-5 rounded-3xl shadow-lg shadow-amber-600/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-slate-950 text-amber-400 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-slate-950/80">
                Rappel d'échéance automatique AfriLoan
              </div>
              <div className="text-base sm:text-lg font-black text-slate-950">
                Prochaine traite de <span className="underline">{nextDue.amount?.toLocaleString("fr-FR")} FCFA</span> due le {new Date(nextDue.date).toLocaleDateString("fr-FR")}
              </div>
              <div className="text-xs text-slate-900/80">
                Prêt : {nextDue.loanTitle}
              </div>
            </div>
          </div>

          <Link
            href={`/app/repay?loanId=${nextDue.loanId}&amount=${nextDue.amount}`}
            className="px-5 py-3 bg-slate-950 text-amber-400 hover:text-amber-300 font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <span>Rembourser maintenant</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Remaining to repay */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Reste à rembourser</span>
            <CreditCard className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {stats.totalRemainingAmount.toLocaleString("fr-FR")}
            <span className="text-xs font-semibold text-slate-400 ml-1">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sur {stats.activeLoansCount} prêt{stats.activeLoansCount > 1 ? "s" : ""} en cours
          </div>
        </div>

        {/* Total borrowed */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total emprunté</span>
            <TrendingUp className="w-4 h-4 text-[#064E29]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#064E29]">
            {user.totalBorrowed.toLocaleString("fr-FR")}
            <span className="text-xs font-semibold text-slate-400 ml-1">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Cumul historique accordé
          </div>
        </div>

        {/* Total Repaid */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Total remboursé</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600">
            {user.totalRepaid.toLocaleString("fr-FR")}
            <span className="text-xs font-semibold text-slate-400 ml-1">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Paiements honorés
          </div>
        </div>

        {/* Available Credit Limit */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
            <span>Crédit disponible</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-700">
            {user.availableCredit.toLocaleString("fr-FR")}
            <span className="text-xs font-semibold text-slate-400 ml-1">FCFA</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Plafond max : {user.creditLimit.toLocaleString("fr-FR")} FCFA
          </div>
        </div>

      </div>

      {/* QUICK ACTIONS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Link
          href="/app/apply"
          className="p-4 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white rounded-2xl shadow-md flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm active:scale-98 transition-all"
        >
          <PlusCircle className="w-5 h-5 text-amber-400" />
          <span>Demander un prêt</span>
        </Link>

        <Link
          href="/app/repay"
          className="p-4 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl shadow-md flex items-center justify-center gap-2.5 font-extrabold text-xs sm:text-sm active:scale-98 transition-all"
        >
          <ArrowUpRight className="w-5 h-5 text-slate-950" />
          <span>Effectuer un remboursement</span>
        </Link>

        <Link
          href="/app/profile"
          className="p-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-2xl shadow-sm flex items-center justify-center gap-2.5 font-bold text-xs sm:text-sm col-span-2 sm:col-span-1 active:scale-98 transition-all"
        >
          <Smartphone className="w-5 h-5 text-slate-500" />
          <span>Gérer Mobile Money</span>
        </Link>
      </div>

      {/* ACTIVE LOANS DETAILS */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <h2 className="text-lg font-black text-slate-900">Mes Prêts en cours</h2>
          </div>
          <Link href="/app/loans" className="text-xs font-bold text-[#064E29] hover:underline flex items-center gap-1">
            <span>Voir l'échéancier complet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {activeLoans.length === 0 ? (
          <div className="text-center py-10 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Vous n'avez aucun prêt actif en ce moment.</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
              Vous pouvez emprunter jusqu'à {user.availableCredit.toLocaleString("fr-FR")} FCFA et recevoir vos fonds immédiatement sur Mobile Money.
            </p>
            <Link
              href="/app/apply"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#064E29] text-white font-bold text-xs rounded-xl shadow-md"
            >
              <span>Demander un financement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeLoans.map((loan: any) => {
              const progress = Math.min(100, Math.round((loan.repaidAmount / loan.totalToRepay) * 100));
              return (
                <div key={loan.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-300 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{loan.title}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          loan.status === "OVERDUE" 
                            ? "bg-rose-100 text-rose-700" 
                            : loan.status === "ACTIVE" 
                            ? "bg-emerald-100 text-emerald-800" 
                            : "bg-amber-100 text-amber-800"
                        }`}>
                          {loan.status === "ACTIVE" ? "En cours" : loan.status === "OVERDUE" ? "Échéance dépassée" : loan.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Emprunté le {new Date(loan.startDate).toLocaleDateString("fr-FR")} • Échéance finale : {new Date(loan.dueDate).toLocaleDateString("fr-FR")}
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <div className="text-xs text-slate-500">Reste à payer</div>
                      <div className="text-base font-black text-[#064E29]">
                        {loan.remainingAmount.toLocaleString("fr-FR")} FCFA
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
                      <span>Remboursé : {loan.repaidAmount.toLocaleString("fr-FR")} FCFA</span>
                      <span>Total dû : {loan.totalToRepay.toLocaleString("fr-FR")} FCFA ({progress}%)</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#064E29] to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action on loan */}
                  {["PENDING", "APPROVED"].includes(loan.status) ? (
                    <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-slate-200/60 mt-2">
                      <span className="text-amber-800 font-bold flex items-center gap-1.5">
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
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Vérifier l'état</span>
                        </button>

                        <a
                          href={`https://wa.me/2250700000000?text=${encodeURIComponent(
                            `Bonjour Service Client AfriLoan, je souhaite faire le point sur ma demande de prêt ${loan.title} d'un montant de ${(loan.amount || 0).toLocaleString("fr-FR")} FCFA (Dossier N° AFL-${loan.id?.slice(-6).toUpperCase()}).`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Contacter le service client</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-2 flex justify-between items-center text-xs">
                      <span className="text-slate-500">
                        Prochaine traite : <strong className="text-slate-800">{loan.nextDueAmount ? `${loan.nextDueAmount.toLocaleString("fr-FR")} FCFA` : "Aucune"}</strong>
                      </span>
                      <Link
                        href={`/app/repay?loanId=${loan.id}`}
                        className="px-4 py-2 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white font-bold rounded-xl shadow-sm hover:opacity-95"
                      >
                        Payer une traite
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* NOTIFICATIONS & REMINDERS SECTION */}
      {notifications && notifications.length > 0 && (
        <div id="notifications" className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-black text-slate-900">Rappels & Notifications Récentes</h3>
          </div>

          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div 
                key={n.id} 
                onClick={() => markNotificationRead(n.id)}
                className="p-3.5 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-100 flex items-start justify-between gap-3 cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">{n.title}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{n.message}</div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    {new Date(n.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full shrink-0">
                  Marquer lu
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RECENT TRANSACTIONS / TIMELINE */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">Dernières Opérations</h3>
          <Link href="/app/history" className="text-xs font-bold text-[#064E29] hover:underline">
            Tout voir
          </Link>
        </div>

        {recentHistory.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Aucune transaction enregistrée pour le moment.</p>
        ) : (
          <div className="space-y-2.5">
            {recentHistory.map((item: any) => {
              const visual = getPaymentMethodVisual(item.description);
              const isDisbursed = item.type === "LOAN_DISBURSEMENT";
              return (
                <div key={item.id} className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 hover:bg-slate-100/70 border border-slate-100 flex items-center justify-between text-xs transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 shadow-2xs">
                      <img src={visual.logoUrl} alt={visual.displayName} className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">{item.description}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                  {item.amount && (
                    <div className={`font-black text-sm text-right shrink-0 pl-2 ${isDisbursed ? "text-emerald-700" : "text-slate-900"}`}>
                      {isDisbursed ? "+" : "-"}{item.amount.toLocaleString("fr-FR")} FCFA
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loan Status Verification & Support Modal */}
      <LoanStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        loan={selectedLoanForStatus}
        onRefresh={fetchDashboard}
      />

    </div>
  );
}
