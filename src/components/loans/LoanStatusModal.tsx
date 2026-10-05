"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone, 
  MessageCircle, 
  PhoneCall, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  FileText 
} from "lucide-react";
import { getMobileMoneyLogo } from "@/lib/countriesData";

interface LoanStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: any;
  onRefresh?: () => void;
}

export default function LoanStatusModal({
  isOpen,
  onClose,
  loan,
  onRefresh
}: LoanStatusModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !loan) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 700);
  };

  const isPending = loan.status === "PENDING";
  const isApproved = loan.status === "APPROVED";
  const isDisbursed = ["ACTIVE", "DISBURSED"].includes(loan.status);
  const isRejected = loan.status === "REJECTED";

  const loanRef = loan.id ? `AFL-${loan.id.slice(-6).toUpperCase()}` : "AFL-DOSSIER";
  const supportPhone = "+2250700000000";
  const whatsAppMessage = encodeURIComponent(
    `Bonjour Service Client AfriLoan, je souhaite faire le point sur l'état de ma demande de prêt ${loan.title} d'un montant de ${(loan.amount || 0).toLocaleString("fr-FR")} FCFA (Dossier N° ${loanRef}). Merci pour votre assistance.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-4 sm:p-7 shadow-2xl relative space-y-5 sm:space-y-6 animate-scaleIn my-auto max-h-[94dvh] overflow-y-auto">
        
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#064E29] border border-emerald-100 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">{loan.title}</h3>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                  #{loanRef}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Montant : <strong className="text-slate-800">{(loan.amount || 0).toLocaleString("fr-FR")} FCFA</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Highlight Banner */}
        <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
          isApproved
            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
            : isRejected
            ? "bg-rose-50 border-rose-200 text-rose-900"
            : isDisbursed
            ? "bg-teal-50 border-teal-200 text-teal-900"
            : "bg-amber-50 border-amber-200 text-amber-900"
        }`}>
          <div className={`p-2 rounded-xl shrink-0 ${
            isApproved
              ? "bg-emerald-600 text-white"
              : isRejected
              ? "bg-rose-600 text-white"
              : isDisbursed
              ? "bg-teal-600 text-white"
              : "bg-amber-500 text-slate-950"
          }`}>
            {isApproved || isDisbursed ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : isRejected ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Clock className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-wider">
              {isApproved
                ? "Demande Approuvée !"
                : isDisbursed
                ? "Prêt Déboursé avec Succès"
                : isRejected
                ? "Dossier Non Retenu"
                : "Demande de Financement en Cours d'Étude"}
            </h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">
              {isApproved
                ? "Votre demande a été approuvée par l'analyste financier. L'ordre de virement automatique vers votre compte Mobile Money est en cours d'exécution."
                : isDisbursed
                ? "Les fonds ont été transférés sur votre compte de réception Mobile Money."
                : isRejected
                ? "Votre demande n'a pas pu être validée pour le moment. Vous pouvez contacter un conseiller pour connaître les critères à améliorer."
                : "Votre dossier complet est en cours d'examen prioritaire par notre comité de validation financière. Le délai habituel de traitement est de 15 à 30 minutes."}
            </p>
          </div>
        </div>

        {/* Progression Timeline / Steps */}
        <div className="space-y-4 bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-100">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Étapes de Traitement</span>
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-[11px] font-bold text-[#064E29] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Actualiser</span>
            </button>
          </h4>

          <div className="space-y-3.5 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
            
            {/* Step 1: Submission */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Dossier de prêt soumis</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(loan.createdAt || loan.startDate).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Formulaire rempli, motif spécifié et numéro récepteur enregistré.
                </p>
              </div>
            </div>

            {/* Step 2: Solvency Verification */}
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Garantie & Solvabilité</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Vérifié
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Mode de solvabilité sécurisé et score de crédit conforme aux critères AfriLoan.
                </p>
              </div>
            </div>

            {/* Step 3: Committee review */}
            <div className="flex items-start gap-3 relative z-10">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                isApproved || isDisbursed
                  ? "bg-emerald-600 text-white"
                  : isRejected
                  ? "bg-rose-600 text-white"
                  : "bg-amber-500 text-slate-950 ring-4 ring-amber-500/20"
              }`}>
                {isApproved || isDisbursed ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Clock className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Validation Financière Finale</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isApproved || isDisbursed 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {isApproved || isDisbursed ? "Validé" : "En cours"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Revue administrative et signature du contrat de crédit numérique.
                </p>
              </div>
            </div>

            {/* Step 4: Disbursement */}
            <div className="flex items-start gap-3 relative z-10">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                isDisbursed
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-400"
              }`}>
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Décaissement Mobile Money</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isDisbursed ? "bg-teal-100 text-teal-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    {isDisbursed ? "Effectué" : "En attente"}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-1 text-[11px] text-slate-500">
                  <span>Versement immédiat vers</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                    <img 
                      src={getMobileMoneyLogo(loan.disbursementMethod)} 
                      alt="" 
                      className="w-4 h-4 rounded-md object-contain bg-white p-0.5 border border-slate-200 shrink-0" 
                    />
                    <span>{loan.disbursementMethod || "Mobile Money"}</span>
                  </span>
                  <span className="font-mono text-slate-500 font-semibold">({loan.disbursementPhone || "Numéro enregistré"})</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Direct WhatsApp VIP Assistance Reassurance */}
        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-[#064E29]">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Besoin d'une validation immédiate ?</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Pour accélérer le virement de vos fonds sans attendre la file standard, contactez directement votre conseiller référent sur WhatsApp en transmettant votre numéro de dossier.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <a
            href={`https://wa.me/2250700000000?text=${whatsAppMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contacter le Service Client</span>
          </a>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}
