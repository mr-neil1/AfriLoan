"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  Lock, 
  ShieldCheck, 
  Check, 
  X, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  EyeOff, 
  HelpCircle 
} from "lucide-react";

interface CardLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardLinked: (card: any) => void;
}

type CardBrand = "VISA" | "MASTERCARD" | "AMEX" | "OTHER";
type CardTheme = "emerald" | "midnight" | "gold" | "royal";

export default function CardLinkModal({
  isOpen,
  onClose,
  onCardLinked
}: CardLinkModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardColor, setCardColor] = useState<CardTheme>("emerald");
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCvc, setShowCvc] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any | null>(null);

  // Verrouillage du scroll en arrière-plan sur mobile
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

  // Détection dynamique du réseau de carte
  const getCardBrand = (num: string): CardBrand => {
    const clean = num.replace(/\D/g, "");
    if (/^4/.test(clean)) return "VISA";
    if (/^(5[1-5]|2[2-7])/.test(clean)) return "MASTERCARD";
    if (/^3[47]/.test(clean)) return "AMEX";
    return "OTHER";
  };

  const detectedBrand = getCardBrand(cardNumber);

  // Formatage du numéro de carte (espaces tous les 4 chiffres)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const parts = raw.match(/.{1,4}/g);
    setCardNumber(parts ? parts.join(" ") : raw);
    setError(null);
  };

  // Formatage de la date d'expiration MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    }
    setExpiryDate(raw);
    setError(null);
  };

  // Formatage du CVC
  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    setCvc(raw);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNumber = cardNumber.replace(/\s+/g, "");
    if (cleanNumber.length < 15 || cleanNumber.length > 16) {
      setError("Veuillez saisir un numéro de carte bancaire valide à 16 chiffres.");
      return;
    }

    if (!cardHolder.trim() || cardHolder.trim().length < 3) {
      setError("Veuillez indiquer le nom complet figurant sur la carte.");
      return;
    }

    if (!expiryDate || expiryDate.length < 5) {
      setError("Veuillez indiquer la date d'expiration au format MM/AA.");
      return;
    }

    const [monthStr, yearStr] = expiryDate.split("/");
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;

    if (isNaN(month) || month < 1 || month > 12) {
      setError("Mois d'expiration invalide (doit être compris entre 01 et 12).");
      return;
    }

    if (isNaN(year) || year < currentYear || (year === currentYear && month < currentMonth)) {
      setError("La date d'expiration de votre carte bancaire est déjà dépassée.");
      return;
    }

    if (!cvc || cvc.length < 3) {
      setError("Veuillez saisir le code de sécurité CVC à 3 chiffres situé au verso.");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          cardNumber: cleanNumber,
          cardHolder: cardHolder.trim().toUpperCase(),
          expiryMonth: monthStr,
          expiryYear: yearStr,
          cvc,
          cardBrand: detectedBrand,
          cardColor
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'enregistrement de la carte bancaire.");

      setSuccessInfo(data);
      onCardLinked(data.card);
      setTimeout(() => {
        onClose();
        // Reset states
        setCardNumber("");
        setCardHolder("");
        setExpiryDate("");
        setCvc("");
        setSuccessInfo(null);
      }, 2500);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Thèmes graphiques pour la carte
  const themeGradients = {
    emerald: "from-[#064E29] via-[#0A5C36] to-emerald-700 border-emerald-400/40 text-white shadow-emerald-950/40",
    midnight: "from-slate-950 via-slate-900 to-slate-800 border-slate-600/40 text-white shadow-slate-950/40",
    gold: "from-[#78350F] via-[#92400E] to-amber-600 border-amber-400/50 text-amber-50 shadow-amber-950/40",
    royal: "from-blue-950 via-indigo-900 to-blue-800 border-blue-400/40 text-white shadow-blue-950/40"
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[94dvh] sm:max-h-[90vh] bg-white transition-all duration-300">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 text-[#064E29] flex items-center justify-center font-bold shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-black text-slate-900 truncate">
                Ajouter une Carte Bancaire
              </h2>
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
                Certificat de solvabilité certifié AfriLoan (+100 pts)
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* Success Animation */}
          {successInfo ? (
            <div className="py-8 text-center space-y-4 animate-scaleIn">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-9 h-9 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Carte Bancaire Certifiée !</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Votre carte <strong>{detectedBrand}</strong> (•••• {cardNumber.replace(/\s+/g, "").slice(-4)}) a été enregistrée avec succès.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-black">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>+100 points ajoutés au score de solvabilité</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Trust & Guarantee Banner */}
              <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#064E29] shrink-0" />
                <div className="text-xs text-emerald-950">
                  <span className="font-black">Cryptage Bancaire Sécurisé (AES-256)</span>
                  <p className="text-[11px] text-emerald-800 font-medium">
                    Ajoutez votre carte Visa ou Mastercard pour certifier vos moyens de paiement et obtenir un taux préférentiel.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* LIVE 3D VISUAL CREDIT CARD PREVIEW */}
              <div className="perspective-1000 py-1">
                <div 
                  className={`w-full max-w-sm mx-auto aspect-[1.586] rounded-2xl p-4 sm:p-5 relative shadow-xl border transition-all duration-500 flex flex-col justify-between overflow-hidden bg-gradient-to-tr ${themeGradients[cardColor]}`}
                  style={{
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)"
                  }}
                >
                  
                  {/* RECTO OF CARD */}
                  <div 
                    className="w-full h-full flex flex-col justify-between"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    {/* Top Row: Chip, Contactless & Brand Logo */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Realistic EMV Metallic Chip */}
                        <div className="w-10 h-7 sm:w-11 sm:h-8 rounded-lg bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-yellow-300 shadow-sm flex items-center justify-center p-1 relative overflow-hidden">
                          <div className="w-full h-full border border-yellow-600/50 rounded grid grid-cols-2 grid-rows-2">
                            <div className="border-r border-b border-yellow-600/40"></div>
                            <div className="border-b border-yellow-600/40"></div>
                            <div className="border-r border-yellow-600/40"></div>
                            <div></div>
                          </div>
                        </div>

                        {/* Contactless waves icon */}
                        <div className="flex items-center -space-x-1 opacity-80">
                          <div className="w-2.5 h-2.5 border-r-2 border-white/80 rounded-full"></div>
                          <div className="w-3.5 h-3.5 border-r-2 border-white/80 rounded-full"></div>
                          <div className="w-4.5 h-4.5 border-r-2 border-white/80 rounded-full"></div>
                        </div>
                      </div>

                      {/* Card Brand Badge */}
                      <div className="text-right">
                        {detectedBrand === "VISA" ? (
                          <div className="font-black text-xl italic tracking-wider text-white drop-shadow">
                            VISA
                          </div>
                        ) : detectedBrand === "MASTERCARD" ? (
                          <div className="flex items-center -space-x-2.5">
                            <div className="w-6 h-6 rounded-full bg-rose-600/90 shadow-sm"></div>
                            <div className="w-6 h-6 rounded-full bg-amber-400/90 shadow-sm"></div>
                          </div>
                        ) : detectedBrand === "AMEX" ? (
                          <div className="text-xs font-black px-2 py-1 bg-white text-blue-900 rounded font-mono">
                            AMEX
                          </div>
                        ) : (
                          <div className="text-xs font-mono font-bold tracking-widest uppercase opacity-75">
                            AFRILOAN
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Middle Row: Card Number */}
                    <div className="my-auto py-2">
                      <p className="font-mono text-base sm:text-lg tracking-[0.2em] font-bold drop-shadow-sm select-none text-white">
                        {cardNumber ? cardNumber.padEnd(19, "•") : "••••  ••••  ••••  ••••"}
                      </p>
                    </div>

                    {/* Bottom Row: Holder Name & Expiry */}
                    <div className="flex items-end justify-between text-xs pt-1 select-none">
                      <div className="min-w-0 flex-1 pr-3">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-70 block font-semibold">
                          Titulaire de la carte
                        </span>
                        <p className="font-mono font-bold uppercase truncate text-[11px] sm:text-xs tracking-wider">
                          {cardHolder || "VOTRE NOM ET PRENOM"}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[8px] sm:text-[9px] uppercase tracking-wider opacity-70 block font-semibold">
                          Expire Fin
                        </span>
                        <p className="font-mono font-bold text-xs">
                          {expiryDate || "MM/AA"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* VERSO OF CARD (Rotated 180deg) */}
                  <div 
                    className="absolute inset-0 w-full h-full p-4 flex flex-col justify-between"
                    style={{ 
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)"
                    }}
                  >
                    {/* Magnetic Stripe */}
                    <div className="w-full h-9 bg-black -mx-4 mt-2 shadow-inner"></div>

                    {/* Signature strip & CVC box */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[8px] opacity-75 uppercase font-bold tracking-wider">
                        <span>Signature autorisée</span>
                        <span>Code de sécurité (CVC)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-7 bg-white/90 rounded-l flex-1 flex items-center px-2 text-slate-800 text-[10px] italic font-serif select-none overflow-hidden">
                          {cardHolder || "Signature du porteur"}
                        </div>
                        <div className="h-7 px-3 bg-white text-slate-950 font-mono font-bold text-xs rounded-r flex items-center justify-center border-l border-slate-300">
                          {showCvc ? cvc : cvc ? "•••" : "•••"}
                        </div>
                      </div>
                    </div>

                    {/* Footer text */}
                    <div className="text-[7.5px] opacity-70 text-center leading-tight">
                      Cette carte est émise sous licence financière sécurisée. En cas de perte, contactez immédiatement le service client AfriLoan.
                    </div>
                  </div>

                </div>
              </div>

              {/* Theme Color Selector */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-bold text-slate-600">Style de la carte :</span>
                <div className="flex items-center gap-1.5">
                  {(["emerald", "midnight", "gold", "royal"] as CardTheme[]).map((theme) => (
                    <button
                      key={theme}
                      type="button"
                      onClick={() => setCardColor(theme)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${
                        cardColor === theme ? "scale-110 ring-2 ring-emerald-500 ring-offset-1" : "opacity-70 hover:opacity-100"
                      } ${
                        theme === "emerald" ? "bg-[#064E29] border-emerald-400" :
                        theme === "midnight" ? "bg-slate-900 border-slate-500" :
                        theme === "gold" ? "bg-amber-600 border-amber-300" : "bg-blue-800 border-blue-400"
                      }`}
                      aria-label={`Thème ${theme}`}
                    />
                  ))}
                </div>
              </div>

              {/* Input Fields */}
              <div className="space-y-3 pt-2">
                
                {/* 1. Card Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Numéro de Carte Bancaire (16 chiffres)
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-3.5 text-slate-400">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="4532 8901 2345 6789"
                      maxLength={19}
                      className="w-full pl-10 pr-16 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white transition-all shadow-inner"
                      required
                    />
                    <div className="absolute right-3 top-3 text-xs font-bold text-[#064E29]">
                      {detectedBrand !== "OTHER" ? detectedBrand : ""}
                    </div>
                  </div>
                </div>

                {/* 2. Cardholder Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nom et Prénom sur la Carte
                  </label>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                    onFocus={() => setIsFlipped(false)}
                    placeholder="Ex: KOUASSI KOUAME JEAN"
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white uppercase transition-all"
                    required
                  />
                </div>

                {/* 3. Expiration & CVC Row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Expiration */}
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Expiration (MM/AA)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      onFocus={() => setIsFlipped(false)}
                      placeholder="12/28"
                      maxLength={5}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white transition-all text-center"
                      required
                    />
                  </div>

                  {/* CVC / CVV */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>Code CVC</span>
                        <HelpCircle className="w-3 h-3 text-slate-400" />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCvc(!showCvc)}
                        className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-0.5"
                      >
                        {showCvc ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showCvc ? "Masquer" : "Afficher"}</span>
                      </button>
                    </div>
                    <input
                      type={showCvc ? "text" : "password"}
                      inputMode="numeric"
                      value={cvc}
                      onChange={handleCvcChange}
                      onFocus={() => setIsFlipped(true)}
                      placeholder="•••"
                      maxLength={4}
                      className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white transition-all text-center tracking-widest"
                      required
                    />
                  </div>
                </div>

                {/* Flip Card Switcher Button */}
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline cursor-pointer"
                  >
                    {isFlipped ? "↺ Voir le recto de la carte" : "↻ Retourner la carte pour voir le verso"}
                  </button>
                </div>

              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 active:scale-[0.98] text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  {isLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Enregistrer & Certifier ma Carte Bancaire</span>
                    </>
                  )}
                </button>
              </div>

              {/* Security Footnote */}
              <div className="text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                <span>Connexion sécurisée SSL 256-bit • Données chiffrées de bout en bout</span>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
