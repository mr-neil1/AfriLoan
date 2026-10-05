"use client";

import { 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Lock, 
  Sparkles,
  Award
} from "lucide-react";
import { ScoreBreakdown } from "@/lib/creditScore";

interface CreditScoreWidgetProps {
  score: number;
  creditLimit: number;
  currencySymbol?: string;
  breakdown?: ScoreBreakdown | null;
  onActionClick?: (actionId: string) => void;
}

export default function CreditScoreWidget({
  score,
  creditLimit,
  currencySymbol = "FCFA",
  breakdown,
  onActionClick
}: CreditScoreWidgetProps) {
  // Score tier
  const getTier = (s: number) => {
    if (s < 100) return { name: "Départ (Micro-Prêt)", color: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200" };
    if (s < 250) return { name: "Bronze (Coup de Pouce)", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" };
    if (s < 450) return { name: "Argent (Standard)", color: "text-slate-700", bg: "bg-slate-100", border: "border-slate-300" };
    if (s < 700) return { name: "Or (Avancé)", color: "text-yellow-800", bg: "bg-yellow-50", border: "border-yellow-300" };
    return { name: "Diamant (Élite)", color: "text-[#064E29]", bg: "bg-emerald-50", border: "border-emerald-300" };
  };

  const tier = getTier(score);
  const percentage = Math.min(100, Math.round((score / 1000) * 100));

  return (
    <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 sm:space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#064E29] to-[#0A5C36] text-white flex items-center justify-center shadow-md shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm sm:text-base font-black text-slate-900">Score de Solvabilité Dynamique</h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${tier.bg} ${tier.color} ${tier.border}`}>
                {tier.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Évolue en temps réel dès que vous complétez vos vérifications de sécurité.
            </p>
          </div>
        </div>

        {/* Big numbers */}
        <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="text-2xl sm:text-3xl font-black text-[#064E29] tracking-tight">
            {score}
            <span className="text-xs sm:text-sm font-semibold text-slate-400 ml-1">/ 1000</span>
          </div>
          <div className="text-xs font-bold text-amber-700 mt-0.5">
            Plafond débloqué : {creditLimit.toLocaleString("fr-FR")} {currencySymbol}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold">
          <span className="text-slate-500">Progression du profil</span>
          <span className="text-[#064E29] font-black">{percentage}% complété</span>
        </div>
        <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div 
            className="h-full bg-gradient-to-r from-[#064E29] via-emerald-600 to-amber-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.max(5, percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
          <span>50 pts (10 000 {currencySymbol})</span>
          <span>500 pts (200 000 {currencySymbol})</span>
          <span>1000 pts (2M {currencySymbol})</span>
        </div>
      </div>

      {/* Criteria Breakdown Checklist */}
      {breakdown && breakdown.criteria && (
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Actions pour augmenter votre score & plafond
            </h4>
            <span className="text-[11px] font-semibold text-slate-400">
              {breakdown.criteria.filter(c => c.completed).length} / {breakdown.criteria.length} validés
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2.5">
            {breakdown.criteria.map((crit) => (
              <div
                key={crit.id}
                onClick={() => onActionClick && onActionClick(crit.id)}
                className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                  crit.completed
                    ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-950"
                    : "bg-slate-50/80 border-slate-200/80 text-slate-700 hover:bg-slate-100/80 cursor-pointer"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {crit.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold truncate">{crit.label}</span>
                    <span className={`text-[10px] font-black shrink-0 px-2 py-0.5 rounded-full ${
                      crit.completed ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
                    }`}>
                      +{crit.points} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {crit.hint}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
