"use client";

import { useEffect, useState } from "react";
import { User as UserIcon, Mail, Phone, ShieldCheck, LogOut, Smartphone, Check, Lock, KeyRound, AlertCircle, ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/lib/LanguageContext";
import { ALL_MOBILE_OPERATORS, getMobileMoneyLogo } from "@/lib/countriesData";
import { useSwrLocalCache, invalidateCachePattern } from "@/lib/storageCache";

export default function ProfilePage() {
  const { language, setLanguage } = useTranslation();

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobileMoneyProvider, setMobileMoneyProvider] = useState("ORANGE_MONEY");
  const [mobileMoneyNumber, setMobileMoneyNumber] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Fetcher for user profile
  const fetchUserProfile = async () => {
    const token = localStorage.getItem("afriloan_token");
    if (!token) {
      window.location.href = "/auth";
      throw new Error("Non authentifié");
    }

    const res = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      throw new Error("Erreur de chargement du profil");
    }
    const data = await res.json();
    return data.user;
  };

  // Instant SWR cache load from localStorage with background revalidation
  const {
    data: user,
    isLoading,
    isRevalidating,
    refresh: fetchProfile
  } = useSwrLocalCache<any>({
    cacheKey: "user_profile_cache",
    fetcher: fetchUserProfile,
    ttlMs: 1000 * 60 * 15,
    onSuccess: (u) => {
      if (u) {
        setName(u.name || "");
        setEmail(u.email || "");
        setPhone(u.phone || "");
        setMobileMoneyProvider(u.mobileMoneyProvider || "ORANGE_MONEY");
        setMobileMoneyNumber(u.mobileMoneyNumber || u.phone || "");
      }
    }
  });

  // Sync state if initial cache already exists
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setMobileMoneyProvider(user.mobileMoneyProvider || "ORANGE_MONEY");
      setMobileMoneyNumber(user.mobileMoneyNumber || user.phone || "");
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          phone,
          mobileMoneyProvider,
          mobileMoneyNumber,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
          newPin: newPin || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur de mise à jour");
      }

      setMessage({ type: "success", text: "Profil et paramètres mis à jour avec succès !" });
      setCurrentPassword("");
      setNewPassword("");
      setNewPin("");
      
      // Invalider les caches pour que le dashboard et l'app rechargent les données à jour
      invalidateCachePattern("user_");
      invalidateCachePattern("dashboard");
      invalidateCachePattern("me_user");
      
      fetchProfile();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("trigger-afriloan-update"));
    }
    setTimeout(() => {
      setIsCheckingUpdate(false);
    }, 2500);
  };

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <span className="loading loading-spinner loading-md text-[#064E29]"></span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header Profile Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-[#064E29] text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
          {user?.name?.slice(0, 2).toUpperCase() || "AL"}
        </div>
        <div className="text-center sm:text-left flex-1">
          <h1 className="text-2xl font-black text-slate-900">{user?.name}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            <span className="px-3 py-1 bg-emerald-50 text-[#064E29] font-bold text-xs rounded-full border border-emerald-200">
              Score : {user?.creditScore}/1000
            </span>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
              Plafond : {user?.creditLimit.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </div>
      </div>

      {/* KYC & Verification Hub Shortcut Card */}
      <div className="bg-gradient-to-r from-emerald-950 to-[#064E29] text-white p-6 rounded-3xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-400 uppercase tracking-wider">
              Statut Sécurité : {user?.kycStatus || "NON_SOUMIS"}
            </div>
            <h3 className="text-base font-black text-white">Centre de Vérification KYC & Solvabilité</h3>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              CNI, Vidéo de vivacité, domicile Google Maps et liaison bancaire directe.
            </p>
          </div>
        </div>

        <Link
          href="/app/kyc"
          className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95"
        >
          <span>Gérer mes documents KYC</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-2 ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border border-emerald-200" 
            : "bg-rose-50 text-rose-800 border border-rose-200"
        }`}>
          {message.type === "success" ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-6">
        
        {/* Personal details */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Informations personnelles
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de téléphone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00 00"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
              />
            </div>
          </div>
        </div>

        {/* Mobile Money configuration */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Compte de paiement Mobile Money
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {ALL_MOBILE_OPERATORS.map((op) => {
              const isSelected = mobileMoneyProvider === op.id;
              return (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => setMobileMoneyProvider(op.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2 group cursor-pointer relative ${
                    isSelected
                      ? "border-[#064E29] bg-emerald-50/80 text-[#064E29] font-bold shadow-sm ring-2 ring-[#064E29]/20"
                      : "border-slate-200/90 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#064E29] text-white flex items-center justify-center shadow-xs">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 p-1.5 flex items-center justify-center shadow-xs overflow-hidden group-hover:scale-105 transition-transform">
                    <img src={op.logoUrl} alt={op.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[11px] font-extrabold leading-tight">{op.name}</span>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Numéro Mobile Money par défaut (pour déboursements & remboursements)
            </label>
            <input
              type="tel"
              value={mobileMoneyNumber}
              onChange={(e) => setMobileMoneyNumber(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
            />
          </div>
        </div>

        {/* Security & PIN */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Sécurité & Code PIN à 4 chiffres
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau code PIN (4 chiffres)</label>
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Ex: 1234"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Laisser vide si inchangé"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
              />
            </div>
          </div>

          {(newPassword || newPin) && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mot de passe actuel (requis pour confirmer)
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isUpdating}
          className="w-full py-4 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-bold rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
        >
          {isUpdating ? <span className="loading loading-spinner loading-sm"></span> : "Enregistrer les modifications"}
        </button>

      </form>

      {/* Install Mobile App Section */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0A2617] to-slate-900 p-5 rounded-3xl border border-emerald-500/30 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-12 h-12 rounded-2xl bg-[#064E29] border border-emerald-400/40 flex items-center justify-center shrink-0 text-amber-400 shadow-md">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span>Application Mobile AfriLoan</span>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-300 font-mono px-2 py-0.5 rounded-full">PWA / APK</span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Installez l'application sur votre écran d'accueil Android ou iOS pour un accès instantané et sécurisé.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new Event("trigger-afriloan-install"));
            }
          }}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
        >
          <Smartphone className="w-4 h-4" />
          <span>Installer l'application</span>
        </button>
      </div>

      {/* App Version & Synchronization Card */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#064E29] flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="font-black text-slate-900">Version de l'application</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#064E29] font-mono text-[10px] font-bold">
                v1.3.0 (Dernière version)
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Synchronisation automatique avec le serveur AfriLoan
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCheckUpdate}
          disabled={isCheckingUpdate}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 active:scale-[0.98] text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all min-h-[40px] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-spin text-emerald-600" : ""}`} />
          <span>{isCheckingUpdate ? "Vérification..." : "Vérifier les mises à jour"}</span>
        </button>
      </div>

      {/* Logout */}
      <div className="pt-2 text-center">
        <button
          onClick={() => {
            localStorage.removeItem("afriloan_token");
            window.location.href = "/auth";
          }}
          className="text-xs font-bold text-rose-600 hover:text-rose-800"
        >
          Se déconnecter de mon compte
        </button>
      </div>

    </div>
  );
}
