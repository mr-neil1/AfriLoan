"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, ShieldAlert, X, Check, Delete } from "lucide-react";

type AdminPinModalProps = {
  isOpen: boolean;
  title?: string;
  description?: string;
  onConfirm: (pin: string) => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
};

export default function AdminPinModal({
  isOpen,
  title = "Sécurité Administrateur AfriLoan",
  description = "Veuillez saisir votre code PIN administrateur à 4 chiffres pour valider cette opération.",
  onConfirm,
  onClose,
  isLoading = false
}: AdminPinModalProps) {
  const [pin, setPin] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string>("");
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  useEffect(() => {
    if (isOpen) {
      setPin(["", "", "", ""]);
      setError("");
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    setError("");
    const cleaned = value.replace(/[^0-9]/g, "");
    if (!cleaned) {
      const newPin = [...pin];
      newPin[index] = "";
      setPin(newPin);
      return;
    }

    const lastDigit = cleaned[cleaned.length - 1];
    const newPin = [...pin];
    newPin[index] = lastDigit;
    setPin(newPin);

    if (index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const fullPin = pin.join("");
    if (fullPin.length < 4) {
      setError("Veuillez saisir les 4 chiffres de votre code PIN.");
      return;
    }
    try {
      await onConfirm(fullPin);
    } catch (err: any) {
      setError(err?.message || "Erreur de validation du code PIN.");
    }
  };

  const handleVirtualKey = (val: string) => {
    if (val === "BACK") {
      const lastFilledIndex = [...pin].reverse().findIndex(d => d !== "");
      if (lastFilledIndex !== -1) {
        const targetIndex = 3 - lastFilledIndex;
        const newPin = [...pin];
        newPin[targetIndex] = "";
        setPin(newPin);
        inputRefs[targetIndex].current?.focus();
      }
      return;
    }

    const emptyIndex = pin.findIndex(d => d === "");
    if (emptyIndex !== -1) {
      const newPin = [...pin];
      newPin[emptyIndex] = val;
      setPin(newPin);
      if (emptyIndex < 3) {
        inputRefs[emptyIndex + 1].current?.focus();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center border border-slate-100 relative">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 bg-emerald-50 text-[#064E29] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6">{description}</p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Digit Display */}
        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={inputRefs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-slate-200 focus:border-[#064E29] focus:ring-2 focus:ring-[#064E29]/20 outline-none transition-all text-slate-800 bg-slate-50"
            />
          ))}
        </div>

        {/* Virtual keypad */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleVirtualKey(num)}
              className="py-3 text-lg font-semibold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-[#064E29] rounded-xl transition-colors active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPin(["", "", "", ""])}
            className="py-3 text-xs font-semibold text-slate-400 hover:bg-slate-100 rounded-xl"
          >
            Effacer
          </button>
          <button
            type="button"
            onClick={() => handleVirtualKey("0")}
            className="py-3 text-lg font-semibold text-slate-700 bg-slate-50 hover:bg-emerald-50 hover:text-[#064E29] rounded-xl transition-colors active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleVirtualKey("BACK")}
            className="py-3 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || pin.join("").length < 4}
          className="w-full py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white font-semibold rounded-xl shadow-lg shadow-emerald-900/20 hover:opacity-95 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="loading loading-spinner loading-sm"></span>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>Valider l'opération</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
