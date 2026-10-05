"use client";

import { useState, useEffect } from "react";
import { Lock, ShieldCheck, X, AlertCircle, Loader2, Delete } from "lucide-react";
import { getMobileMoneyLogo } from "@/lib/countriesData";

interface DepositPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (pin: string) => Promise<void> | void;
  amount: number | string;
  currencySymbol: string;
  methodName: string;
  phone?: string;
  country?: string;
  isLoading?: boolean;
}

export default function DepositPinModal({
  isOpen,
  onClose,
  onConfirm,
  amount,
  currencySymbol,
  methodName,
  phone = "",
  country = "CI",
  isLoading = false
}: DepositPinModalProps) {
  const [pin, setPin] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [shuffledKeypad, setShuffledKeypad] = useState<number[]>([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

  const isMtnCameroon = methodName?.toLowerCase().includes("mtn") && country?.toUpperCase() === "CM";
  const requiredPinLength = isMtnCameroon ? 5 : 4;

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
    if (isOpen) {
      setPin("");
      setError(null);
      const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }
      setShuffledKeypad(numbers);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;

      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        setPin((prev) => (prev.length < requiredPinLength ? prev + e.key : prev));
      } else if (e.key === "Backspace") {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pin.length === requiredPinLength) {
          handleValidate();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pin, isLoading, requiredPinLength]);

  if (!isOpen) return null;

  const handleKeyPress = (num: number) => {
    if (isLoading) return;
    setError(null);
    if (pin.length < requiredPinLength) {
      setPin((prev) => prev + num.toString());
    }
  };

  const handleDelete = () => {
    if (isLoading) return;
    setError(null);
    setPin((prev) => prev.slice(0, -1));
  };

  const handleValidate = async () => {
    if (pin.length !== requiredPinLength) {
      setError(`Veuillez entrer un code PIN à ${requiredPinLength} chiffres`);
      return;
    }
    try {
      await onConfirm(pin);
    } catch (err: any) {
      setError(err?.message || "Erreur de validation");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-4 sm:p-6 text-center border border-slate-100 relative my-auto max-h-[94dvh] overflow-y-auto">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3.5 right-3.5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-12 h-12 bg-emerald-50 text-[#064E29] rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100 shadow-sm">
          <Lock className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-slate-900 mb-1">Confirmation Mobile Money</h3>
        
        {/* Payment Method Logo Badge */}
        <div className="flex items-center justify-center gap-2.5 mb-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
            <img 
              src={getMobileMoneyLogo(methodName)} 
              alt={methodName} 
              className="w-full h-full object-contain" 
            />
          </div>
          <div className="text-left min-w-0">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Opérateur débité</div>
            <div className="text-xs font-black text-slate-900 truncate">{methodName}</div>
          </div>
        </div>

        <div className="bg-slate-50 rounded-2xl p-3 mb-5 border border-slate-100">
          <div className="text-xs text-slate-500 mb-1">Montant de la transaction</div>
          <div className="text-2xl font-black text-[#064E29]">
            {typeof amount === "number" ? amount.toLocaleString("fr-FR") : amount} {currencySymbol}
          </div>
          {phone && <div className="text-xs text-slate-500 mt-1">Numéro : {phone}</div>}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 mb-6">
          {Array.from({ length: requiredPinLength }).map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                index < pin.length
                  ? "bg-[#064E29] border-[#064E29] scale-110"
                  : "bg-slate-100 border-slate-300"
              }`}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mb-4 sm:mb-5">
          {shuffledKeypad.map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={isLoading}
              className="h-11 sm:h-12 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-[#064E29] font-black text-base sm:text-lg rounded-2xl border border-slate-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPin("")}
            disabled={isLoading || pin.length === 0}
            className="h-11 sm:h-12 bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-xs rounded-2xl border border-slate-100 transition-all active:scale-95 disabled:opacity-40"
          >
            Reset
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading || pin.length === 0}
            className="h-11 sm:h-12 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-2xl border border-slate-100 transition-all flex items-center justify-center active:scale-95 disabled:opacity-40"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleValidate}
          disabled={isLoading || pin.length !== requiredPinLength}
          className="w-full py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white font-bold rounded-2xl shadow-lg shadow-emerald-950/20 hover:opacity-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Valider le paiement</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
