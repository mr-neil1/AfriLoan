"use client";

import { useState } from "react";
import { 
  Building2, 
  X, 
  Check, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  AlertCircle,
  CreditCard,
  User,
  KeyRound,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { getCountryConfig, BankInfo } from "@/lib/countriesData";

interface BankLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCountryCode?: string;
  onBankLinked: (bankAccount: any) => void;
}

export default function BankLinkModal({
  isOpen,
  onClose,
  userCountryCode = "CI",
  onBankLinked
}: BankLinkModalProps) {
  const [selectedCountry, setSelectedCountry] = useState(userCountryCode);
  const [selectedBankId, setSelectedBankId] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [onlineBankingId, setOnlineBankingId] = useState("");
  const [bankPassword, setBankPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<"DETAILS" | "SECURITY_AUTH">("DETAILS");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  const countryConfig = getCountryConfig(selectedCountry);
  const banks = countryConfig.banks;
  const selectedBank: BankInfo | undefined = banks.find((b) => b.id === selectedBankId || b.name === selectedBankId);

  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    setSelectedBankId("");
    setStep("DETAILS");
    setError(null);
  };

  const handleProceedToSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedBank) {
      setError("Veuillez sélectionner votre établissement bancaire.");
      return;
    }
    if (!accountNumber || accountNumber.trim().length < 8) {
      setError("Veuillez renseigner un numéro de compte ou RIB valide.");
      return;
    }
    if (!accountHolder || accountHolder.trim().length < 3) {
      setError("Veuillez indiquer le nom complet du propriétaire du compte.");
      return;
    }
    if (!onlineBankingId || onlineBankingId.trim().length < 2) {
      setError(`Veuillez renseigner votre identifiant de connexion ${selectedBank.onlineBankingName}.`);
      return;
    }

    setStep("SECURITY_AUTH");
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!bankPassword || bankPassword.trim().length < 3) {
      setError("Veuillez saisir votre mot de passe ou code confidentiel d'accès en ligne.");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          country: selectedCountry,
          bankName: selectedBank?.name,
          accountNumber,
          accountHolder,
          onlineBankingId,
          onlineBankingName: selectedBank?.onlineBankingName,
          bankThemeColor: selectedBank?.themeGradient || selectedBank?.themeColor,
          bankLogo: selectedBank?.logoUrl || selectedBank?.logoText,
          bankPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la validation du compte bancaire.");

      setSuccessInfo(data);
      onBankLinked(data.bankAccount);
      setTimeout(() => {
        onClose();
        // Reset states
        setStep("DETAILS");
        setSuccessInfo(null);
        setBankPassword("");
      }, 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div 
        className="w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94vh] bg-white transition-all duration-300"
        style={
          step === "SECURITY_AUTH" && selectedBank
            ? { borderColor: `${selectedBank.themeColor}40` }
            : {}
        }
      >
        
        {/* Dynamic Header with Bank Gradient */}
        <div 
          className="p-5 border-b border-slate-100 flex items-center justify-between transition-all duration-300"
          style={
            step === "SECURITY_AUTH" && selectedBank
              ? { 
                  background: selectedBank.themeGradient || selectedBank.themeColor, 
                  color: selectedBank.textColor || "#FFFFFF" 
                }
              : { backgroundColor: "#F8FAFC" }
          }
        >
          <div className="flex items-center gap-3.5">
            {step === "SECURITY_AUTH" && selectedBank ? (
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 shadow-md border border-white/30 flex items-center justify-center overflow-hidden shrink-0">
                {selectedBank.logoUrl ? (
                  <img 
                    src={selectedBank.logoUrl} 
                    alt={selectedBank.name} 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div 
                    className="w-full h-full rounded-xl flex items-center justify-center font-black text-xs"
                    style={{ backgroundColor: selectedBank.themeAccent, color: "#FFFFFF" }}
                  >
                    {selectedBank.logoText}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#064E29] flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            )}

            <div>
              <h2 className={`text-base font-black ${step === "SECURITY_AUTH" ? "text-white" : "text-slate-900"}`}>
                {step === "SECURITY_AUTH" && selectedBank 
                  ? selectedBank.name 
                  : "Liaison de Compte Bancaire"}
              </h2>
              <p className={`text-[11px] font-semibold ${step === "SECURITY_AUTH" ? "text-white/90" : "text-slate-500"}`}>
                {step === "SECURITY_AUTH" && selectedBank 
                  ? `Portail Sécurisé ${selectedBank.onlineBankingName}` 
                  : "Connexion officielle certifiée AfriLoan"}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              step === "SECURITY_AUTH"
                ? "bg-white/20 hover:bg-white/30 text-white"
                : "bg-slate-200/70 hover:bg-slate-300 text-slate-700"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">

          {/* Success State */}
          {successInfo ? (
            <div className="py-8 text-center space-y-4 animate-scaleIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Compte Bancaire Certifié !</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  La liaison avec <strong>{selectedBank?.name}</strong> a été validée avec succès.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-black">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>+150 points ajoutés au score de solvabilité</span>
              </div>
            </div>
          ) : step === "DETAILS" ? (
            
            /* STEP 1: Bank Selection & Details */
            <form onSubmit={handleProceedToSecurity} className="space-y-4">
              
              {/* Trust Badge */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#064E29] shrink-0" />
                <div className="text-xs text-emerald-950">
                  <span className="font-black">Certification Immédiate (+150 pts)</span>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Renseignez vos coordonnées bancaires pour débloquer un taux préférentiel et valider votre solvabilité.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Country Picker */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Pays de l'établissement
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { code: "CM", label: "Cameroun", flag: "🇨🇲" },
                    { code: "CI", label: "Côte d'Ivoire", flag: "🇨🇮" },
                    { code: "GA", label: "Gabon", flag: "🇬🇦" },
                    { code: "CD", label: "RDC", flag: "🇨🇩" }
                  ].map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => handleCountryChange(c.code)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        selectedCountry === c.code
                          ? "border-[#064E29] bg-emerald-50 text-[#064E29] shadow-sm ring-1 ring-[#064E29]"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-base">{c.flag}</span>
                      <span>{c.code}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Picker with Official Logos */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  2. Sélectionner votre banque
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {banks.map((b) => {
                    const isSelected = selectedBank?.id === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          setSelectedBankId(b.id);
                          setError(null);
                        }}
                        className={`p-2.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                          isSelected
                            ? "border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {/* Real Bank Logo Image */}
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center overflow-hidden shrink-0 p-1">
                          {b.logoUrl ? (
                            <img 
                              src={b.logoUrl} 
                              alt={b.name} 
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div 
                              className="w-full h-full rounded-lg flex items-center justify-center font-black text-[10px]"
                              style={{ backgroundColor: b.themeColor, color: b.textColor }}
                            >
                              {b.logoText}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 truncate">{b.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold truncate">
                            {b.onlineBankingName}
                          </p>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3 Form Fields as requested */}
              {selectedBank && (
                <div className="space-y-3 pt-2 border-t border-slate-100 animate-fadeIn">
                  
                  {/* Field 1: RIB */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Numéro de compte / RIB
                    </label>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder={`Ex: ${selectedBank.ribPlaceholder}`}
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29] focus:bg-white"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Indiquez votre relevé d'identité bancaire complet.
                    </p>
                  </div>

                  {/* Field 2: Account Owner Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom complet du propriétaire du compte
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={accountHolder}
                        onChange={(e) => setAccountHolder(e.target.value)}
                        placeholder="Ex: KOUASSI KOUAME JEAN"
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29] focus:bg-white uppercase"
                        required
                      />
                    </div>
                  </div>

                  {/* Field 3: Online Banking Identifier */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Identifiant {selectedBank.onlineBankingName}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={onlineBankingId}
                        onChange={(e) => setOnlineBankingId(e.target.value)}
                        placeholder={`Votre code client ou identifiant ${selectedBank.onlineBankingName.split('/')[0].trim()}`}
                        className="w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29] focus:bg-white"
                        required
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Identifiant utilisé pour vous connecter sur le portail web ou l'application mobile de la banque.
                    </p>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Continuer vers l'authentification sécurisée</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                </div>
              )}

            </form>

          ) : (

            /* STEP 2: Dedicated Bank-Branded Security Modal */
            <form onSubmit={handleFinalSubmit} className="space-y-4 animate-fadeIn">
              
              {/* Bank Themed Security Card */}
              <div 
                className="p-4 rounded-2xl border text-left space-y-2.5 relative overflow-hidden"
                style={{
                  background: `${selectedBank?.themeColor}0D`,
                  borderColor: `${selectedBank?.themeColor}35`
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock 
                      className="w-4 h-4"
                      style={{ color: selectedBank?.themeColor }}
                    />
                    <span 
                      className="text-xs font-black uppercase tracking-wider"
                      style={{ color: selectedBank?.themeColor }}
                    >
                      Authentification {selectedBank?.onlineBankingName.split('/')[0].trim()}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    SSL 256-bit
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm p-1.5 flex items-center justify-center shrink-0">
                    {selectedBank?.logoUrl ? (
                      <img 
                        src={selectedBank.logoUrl} 
                        alt={selectedBank.name} 
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="font-bold text-xs">{selectedBank?.logoText}</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700 min-w-0 flex-1 space-y-0.5">
                    <p className="font-extrabold text-slate-900 truncate">{selectedBank?.name}</p>
                    <p className="text-[11px] text-slate-600">
                      Identifiant : <strong className="font-mono">{onlineBankingId}</strong>
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      RIB : {accountNumber} • {accountHolder}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Password / Access Code Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-900">
                  Mot de passe ou Code secret d'accès {selectedBank?.onlineBankingName}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={bankPassword}
                    onChange={(e) => setBankPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe bancaire"
                    className="w-full px-4 py-3.5 pr-11 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-semibold focus:outline-none focus:bg-white transition-all shadow-inner"
                    style={{
                      outlineColor: selectedBank?.themeColor
                    }}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                  🔒 <strong>Garantie de Sécurité :</strong> Cette vérification permet de certifier que vous êtes l'unique titulaire du compte et de valider votre solvabilité instantanément.
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("DETAILS");
                    setError(null);
                  }}
                  disabled={isLoading}
                  className="px-4 py-3.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Modifier</span>
                </button>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3.5 text-white font-black text-xs rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 hover:opacity-95 hover:scale-[1.01]"
                  style={{
                    background: selectedBank?.themeGradient || selectedBank?.themeColor || "#064E29",
                    color: selectedBank?.textColor || "#FFFFFF"
                  }}
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Confirmer & Authentifier mon Compte</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          )}

        </div>

      </div>
    </div>
  );
}
