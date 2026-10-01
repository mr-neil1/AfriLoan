"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Delete, ShieldCheck, AlertCircle } from "lucide-react";

function PinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "login";
  
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (mode === "login") {
      const savedEmail = localStorage.getItem("afriloan_mobile_email");
      if (!savedEmail) {
        router.replace("/auth");
      } else {
        setEmail(savedEmail);
      }
    }
  }, [mode, router]);

  const handleKeyPress = (num: string) => {
    if (error) setError(null);
    
    if (step === "enter" && pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (mode === "login") {
          submitLogin(newPin);
        } else {
          setTimeout(() => setStep("confirm"), 300);
        }
      }
    } else if (step === "confirm" && confirmPin.length < 4) {
      const newConfirm = confirmPin + num;
      setConfirmPin(newConfirm);
      if (newConfirm.length === 4) {
        if (newConfirm === pin) {
          submitSetup(pin);
        } else {
          setError("Les codes PIN ne correspondent pas. Réessayez.");
          setPin("");
          setConfirmPin("");
          setStep("enter");
        }
      }
    }
  };

  const handleDelete = () => {
    if (error) setError(null);
    if (step === "enter") {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
  };

  const submitLogin = async (pinToSubmit: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/pin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin: pinToSubmit }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Code PIN incorrect.");
      }
      localStorage.setItem("afriloan_token", data.token);
      sessionStorage.setItem("afriloan_session_unlocked", "true");
      router.replace("/app");
    } catch (err: any) {
      setError(err.message);
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const submitSetup = async (pinToSubmit: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/auth/pin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ pin: pinToSubmit }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de configuration.");
      }
      sessionStorage.setItem("afriloan_session_unlocked", "true");
      router.replace("/app");
    } catch (err: any) {
      setError(err.message);
      setPin("");
      setConfirmPin("");
      setStep("enter");
    } finally {
      setIsLoading(false);
    }
  };

  const currentLength = step === "enter" ? pin.length : confirmPin.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 text-center">
        
        <div className="w-14 h-14 bg-emerald-50 text-[#064E29] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-sm">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-black text-slate-900 mb-1">
          {mode === "login" 
            ? "Déverrouillage AfriLoan" 
            : step === "enter" ? "Créer votre code PIN" : "Confirmez votre code PIN"}
        </h2>
        
        <p className="text-xs text-slate-500 mb-6">
          {mode === "login" 
            ? `Connecté en tant que ${email}`
            : step === "enter" 
              ? "Définissez un code secret à 4 chiffres" 
              : "Saisissez à nouveau votre code PIN"}
        </p>

        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                index < currentLength
                  ? "bg-[#064E29] border-[#064E29] scale-125"
                  : "bg-slate-100 border-slate-300"
              }`}
            />
          ))}
        </div>

        {/* Virtual Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              disabled={isLoading || currentLength >= 4}
              className="h-14 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-[#064E29] font-black text-xl rounded-2xl border border-slate-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => { setPin(""); setConfirmPin(""); setStep("enter"); }}
            disabled={isLoading || currentLength === 0}
            className="h-14 bg-slate-50 hover:bg-slate-100 text-slate-400 font-bold text-xs rounded-2xl border border-slate-100 transition-all"
          >
            Reset
          </button>
          <button
            onClick={() => handleKeyPress("0")}
            disabled={isLoading || currentLength >= 4}
            className="h-14 bg-slate-50 hover:bg-emerald-50 text-slate-800 hover:text-[#064E29] font-black text-xl rounded-2xl border border-slate-100 transition-all active:scale-95 disabled:opacity-50"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading || currentLength === 0}
            className="h-14 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-2xl border border-slate-100 transition-all flex items-center justify-center active:scale-95 disabled:opacity-40"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("afriloan_token");
              router.replace("/auth");
            }}
            className="text-xs text-slate-500 hover:text-[#064E29] font-semibold"
          >
            Se connecter avec un autre compte
          </button>
        )}

      </div>
    </div>
  );
}

export default function PinPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <PinForm />
    </Suspense>
  );
}
