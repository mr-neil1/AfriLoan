"use client";

import { useState, useEffect } from "react";
import { Mail, Lock, User, ArrowRight, CheckCircle2, Smartphone, ShieldCheck, ArrowLeft } from "lucide-react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Link from "next/link";

type AuthState = "splash" | "login" | "register" | "otp";

function AuthForm() {
  const [authState, setAuthState] = useState<AuthState>("login");

  // Form inputs
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [phone, setPhone] = useState<string | undefined>();
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState<string>("ORANGE_MONEY");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string | undefined>();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const tab = searchParams.get("tab") as AuthState;
    const ref = searchParams.get("ref");
    if (ref) setReferralCode(ref);
    if (tab === "register" || tab === "login") {
      setAuthState(tab);
    }
  }, []);

  const handleSuccessfulAuth = (token: string, userEmail: string, hasPin: boolean) => {
    localStorage.setItem("afriloan_token", token);
    localStorage.setItem("afriloan_mobile_email", userEmail);
    sessionStorage.setItem("afriloan_session_unlocked", "true");

    const isMobile = localStorage.getItem("afriloan_is_mobile_app") === "true";
    if (isMobile && !hasPin) {
      window.location.href = "/auth/pin?mode=setup";
    } else {
      window.location.href = "/app";
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      return setError("Les mots de passe ne correspondent pas.");
    }
    if (password.length < 6) {
      return setError("Le mot de passe doit comporter au moins 6 caractères.");
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone,
          mobileMoneyProvider,
          mobileMoneyNumber: mobileMoneyNumber || phone,
          referralCode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription.");
      }

      setAuthState("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.requiresVerification) {
          setAuthState("otp");
          return;
        }
        throw new Error(data.error || "Identifiants invalides.");
      }

      handleSuccessfulAuth(data.token, email, data.hasPin);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Code incorrect.");
      }

      // Automatically log in after verification
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();
      if (loginRes.ok) {
        handleSuccessfulAuth(loginData.token, email, loginData.hasPin);
      } else {
        setAuthState("login");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        alert("Nouveau code envoyé sur votre adresse e-mail.");
      } else {
        setError(data.error || "Erreur de renvoi.");
      }
    } catch (err) {
      setError("Erreur de connexion.");
    }
  };

  // Google Login Hook
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ googleAccessToken: tokenResponse.access_token }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Échec de connexion Google.");
        }
        handleSuccessfulAuth(data.token, data.user.email, data.hasPin);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => {
      setError("Échec de la connexion avec Google.");
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-block">
          <img src="/logo.png" alt="AfriLoan" className="h-16 w-auto mx-auto object-contain drop-shadow-sm" />
        </Link>
        <p className="mt-2 text-xs font-bold text-[#064E29] uppercase tracking-wider">
          Vos projets, notre priorité
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/60 rounded-3xl border border-slate-100">
          
          {/* Tabs */}
          {authState !== "otp" && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setAuthState("login"); setError(null); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  authState === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Connexion
              </button>
              <button
                type="button"
                onClick={() => { setAuthState("register"); setError(null); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                  authState === "register"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Créer un compte
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {authState === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#064E29] focus:ring-1 focus:ring-[#064E29]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#064E29] focus:ring-1 focus:ring-[#064E29]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <Link href="/auth/pin" className="font-semibold text-[#064E29] hover:underline">
                  Connexion rapide avec PIN
                </Link>
                <a href="https://wa.me/2250700000000" target="_blank" className="text-slate-500 hover:text-slate-800">
                  Mot de passe oublié ?
                </a>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <span className="loading loading-spinner loading-sm"></span> : (
                  <>
                    <span>Se connecter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {authState === "register" && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom et Prénom(s)</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Ibrahim Konan"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#064E29]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse e-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#064E29]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone</label>
                <PhoneInput
                  international
                  defaultCountry="CI"
                  value={phone}
                  onChange={setPhone}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Mobile Money Operator */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Opérateur Mobile Money favori</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "ORANGE_MONEY", name: "Orange Money" },
                    { id: "MTN_MOMO", name: "MTN MoMo" },
                    { id: "WAVE", name: "Wave" },
                    { id: "AIRTEL_MONEY", name: "Airtel Money" }
                  ].map(op => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setMobileMoneyProvider(op.id)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                        mobileMoneyProvider === op.id
                          ? "border-[#064E29] bg-emerald-50 text-[#064E29] font-bold"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {op.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#064E29]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirmer mot de passe</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Répétez le mot de passe"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#064E29]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? <span className="loading loading-spinner loading-sm"></span> : (
                  <>
                    <span>Créer mon compte</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* OTP VERIFICATION */}
          {authState === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#064E29] flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Vérification de sécurité</h3>
              <p className="text-xs text-slate-500">
                Un code de vérification à 6 chiffres a été envoyé à <strong>{email}</strong>.
              </p>

              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="123456"
                  className="w-full text-center tracking-[8px] py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-2xl font-black text-slate-800 focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || otpCode.length < 6}
                className="w-full py-3 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? <span className="loading loading-spinner loading-sm"></span> : "Valider le code"}
              </button>

              <div className="pt-2 flex justify-between text-xs text-slate-500">
                <button type="button" onClick={() => setAuthState("login")} className="hover:text-slate-800">
                  ← Retour
                </button>
                <button type="button" onClick={handleResendOtp} className="text-[#064E29] font-bold hover:underline">
                  Renvoyer un code
                </button>
              </div>
            </form>
          )}

          {/* Google OAuth separator */}
          {authState !== "otp" && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={isLoading}
                className="w-full py-2.5 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continuer avec Google</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "574016516249-be9dcljs5j3i17o3ffa8biqmqnhc2mn0.apps.googleusercontent.com";
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthForm />
    </GoogleOAuthProvider>
  );
}
