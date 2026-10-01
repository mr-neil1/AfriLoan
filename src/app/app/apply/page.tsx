"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CreditCard,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Upload,
  MessageCircle,
  PhoneCall,
  Lock,
  FileText,
  AlertTriangle,
  HelpCircle,
  KeyRound,
  RotateCcw,
  Check,
  Building2,
  Calendar,
  Layers,
  ChevronDown
} from "lucide-react";
import Link from "next/link";
import {
  COUNTRIES_CONFIG,
  getCountryConfig,
  getAllCountries,
  calculateRequiredBalance,
  PaymentMethodInfo,
  detectCountryFromPhone
} from "@/lib/countriesData";
import MobileMoneyPinModal from "@/components/loans/MobileMoneyPinModal";

type ApplyStep = "STEP_OFFERS" | "STEP_PURPOSE" | "STEP_DISBURSEMENT" | "STEP_SOLVENCY" | "STEP_CONFIRMATION";

const DRAFT_STORAGE_KEY = "afriloan_loan_apply_draft_v2";

function ApplyLoanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Navigation Steps
  const [currentStep, setCurrentStep] = useState<ApplyStep>("STEP_OFFERS");
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // User & Packages
  const [user, setUser] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [mode, setMode] = useState<"fixed" | "custom">("fixed");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");

  // Custom loan inputs
  const [customAmount, setCustomAmount] = useState<number>(100000);
  const [customDuration, setCustomDuration] = useState<number>(30);

  // Step 2: Purpose & Fund Usage
  const [purpose, setPurpose] = useState<string>("Commerce & Stock");
  const [purposeDetails, setPurposeDetails] = useState<string>("");

  // Step 3: Mobile Money Disbursement & PIN
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("CI");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("wave");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [mobilePin, setMobilePin] = useState<string>("");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Step 4: Solvency Verification
  const [fundVerificationMethod, setFundVerificationMethod] = useState<"GATEWAY" | "SCREENSHOT">("GATEWAY");
  const [fundScreenshotUrl, setFundScreenshotUrl] = useState<string>("");
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submitting & Results
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Initial Data & Persistent Draft
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Sync draft to localStorage on any state change
  useEffect(() => {
    if (!hasRestoredDraft) return;
    if (isSuccess) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    const draft = {
      currentStep,
      mode,
      selectedPackageId,
      customAmount,
      customDuration,
      purpose,
      purposeDetails,
      selectedCountryCode,
      paymentMethodId,
      phoneNumber,
      mobilePin,
      fundVerificationMethod,
      fundScreenshotUrl: fundScreenshotUrl.startsWith("data:") ? "" : fundScreenshotUrl // Avoid huge base64 in localStorage
    };

    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (e) {
      // ignore storage quota
    }
  }, [
    currentStep,
    mode,
    selectedPackageId,
    customAmount,
    customDuration,
    purpose,
    purposeDetails,
    selectedCountryCode,
    paymentMethodId,
    phoneNumber,
    mobilePin,
    fundVerificationMethod,
    fundScreenshotUrl,
    hasRestoredDraft,
    isSuccess
  ]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem("afriloan_token");
      if (!token) return router.replace("/auth");

      const [meRes, pkgRes] = await Promise.all([
        fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/packages")
      ]);

      let currentUser: any = null;
      if (meRes.ok) {
        const meData = await meRes.json();
        currentUser = meData.user;
        setUser(currentUser);
      }

      let loadedPackages: any[] = [];
      if (pkgRes.ok) {
        const pkgData = await pkgRes.json();
        loadedPackages = pkgData.packages || [];
        setPackages(loadedPackages);
      }

      // Check Saved Draft from localStorage
      const savedDraftStr = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraftStr) {
        try {
          const draft = JSON.parse(savedDraftStr);
          if (draft.currentStep && draft.currentStep !== "STEP_CONFIRMATION") {
            setCurrentStep(draft.currentStep);
          }
          if (draft.mode) setMode(draft.mode);
          if (draft.selectedPackageId) setSelectedPackageId(draft.selectedPackageId);
          else if (loadedPackages.length > 0) setSelectedPackageId(loadedPackages[0].id);

          if (draft.customAmount) setCustomAmount(draft.customAmount);
          if (draft.customDuration) setCustomDuration(draft.customDuration);
          if (draft.purpose) setPurpose(draft.purpose);
          if (draft.purposeDetails) setPurposeDetails(draft.purposeDetails);
          if (draft.selectedCountryCode) setSelectedCountryCode(draft.selectedCountryCode);
          if (draft.paymentMethodId) setPaymentMethodId(draft.paymentMethodId);
          if (draft.phoneNumber) setPhoneNumber(draft.phoneNumber);
          if (draft.mobilePin) setMobilePin(draft.mobilePin);
          if (draft.fundVerificationMethod) setFundVerificationMethod(draft.fundVerificationMethod);

          setHasRestoredDraft(true);
          return;
        } catch (e) {
          // ignore corrupted draft
        }
      }

      // Default setup if no draft
      if (currentUser) {
        const userCountry = currentUser.countryCode || "CI";
        setSelectedCountryCode(userCountry);

        const countryConf = getCountryConfig(userCountry);
        if (countryConf.paymentMethods.length > 0) {
          setPaymentMethodId(countryConf.paymentMethods[0].id);
        }

        if (currentUser.mobileMoneyNumber) {
          setPhoneNumber(currentUser.mobileMoneyNumber);
        } else if (currentUser.phone) {
          setPhoneNumber(currentUser.phone);
        }

        if (currentUser.mobileMoneyProvider) {
          setPaymentMethodId(currentUser.mobileMoneyProvider);
        }
      }

      if (loadedPackages.length > 0) {
        setSelectedPackageId(loadedPackages[0].id);
      }

      // Check URL search parameters
      const paramAmount = searchParams.get("amount");
      const paramDuration = searchParams.get("duration");
      if (paramAmount) {
        setMode("custom");
        setCustomAmount(Number(paramAmount));
      }
      if (paramDuration) {
        setCustomDuration(Number(paramDuration));
      }

      setHasRestoredDraft(true);
    } catch (e) {
      setHasRestoredDraft(true);
    }
  };

  // Country Configuration
  const currentCountry = getCountryConfig(selectedCountryCode);
  const availablePaymentMethods = currentCountry.paymentMethods.filter(m => m.category === "MOBILE_MONEY" || m.category === "WALLET");

  const selectedProviderObj = availablePaymentMethods.find(m => m.id === paymentMethodId) || availablePaymentMethods[0] || null;

  // Selected Loan Calculations
  const selectedPkg = packages.find(p => p.id === selectedPackageId);
  const activeAmount = mode === "fixed" ? (selectedPkg?.amount || 50000) : customAmount;
  const activeDuration = mode === "fixed" ? (selectedPkg?.durationDays || 30) : customDuration;

  // Progressive balance required calculation (30% to 60%)
  const balanceInfo = calculateRequiredBalance(activeAmount);
  const requiredPercentage = balanceInfo.percentage;
  const requiredBalanceAmount = balanceInfo.requiredAmount;

  // Financial simulation calculations
  let customRate = 7.5;
  if (customDuration <= 15) customRate = 5.0;
  else if (customDuration <= 30) customRate = 7.5;
  else if (customDuration <= 60) customRate = 9.0;
  else if (customDuration <= 90) customRate = 11.0;
  else customRate = 12.0;

  const activeRate = mode === "fixed" ? (selectedPkg?.interestRate || 7.5) : customRate;
  const activeInterest = Math.round(activeAmount * (activeRate / 100));
  const activeTotalToRepay = activeAmount + activeInterest;
  const installmentCount = activeDuration >= 90 ? 4 : activeDuration >= 60 ? 3 : activeDuration >= 30 ? 2 : 1;
  const activePerInstallment = Math.round(activeTotalToRepay / installmentCount);

  // Country change handler
  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    const newCountryConf = getCountryConfig(code);
    const validMethods = newCountryConf.paymentMethods.filter(m => m.category === "MOBILE_MONEY" || m.category === "WALLET");
    if (validMethods.length > 0) {
      setPaymentMethodId(validMethods[0].id);
    }
    setMobilePin(""); // reset pin on country switch
  };

  // Phone change handler with auto-detection
  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const detected = detectCountryFromPhone(val);
    if (detected && detected !== selectedCountryCode) {
      handleCountryChange(detected);
    }
  };

  // Screenshot upload handler
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("La capture d'écran ne doit pas dépasser 5 Mo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFundScreenshotUrl(base64);
      setScreenshotPreview(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Clear draft & reset
  const handleResetDraft = () => {
    if (confirm("Voulez-vous réinitialiser votre formulaire de demande de prêt ?")) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setCurrentStep("STEP_OFFERS");
      setMode("fixed");
      setPurpose("Commerce & Stock");
      setPurposeDetails("");
      setMobilePin("");
      setFundScreenshotUrl("");
      setScreenshotPreview(null);
      setError(null);
    }
  };

  // STEP 1 Validation -> STEP 2
  const handleProceedFromOffers = () => {
    setError(null);
    if (mode === "fixed" && !selectedPackageId) {
      setError("Veuillez sélectionner une offre forfaitaire ou basculer en mode Sur-Mesure.");
      return;
    }
    if (mode === "custom" && (customAmount < 10000 || customAmount > 5000000)) {
      setError("Le montant doit être compris entre 10 000 et 5 000 000 FCFA.");
      return;
    }
    setCurrentStep("STEP_PURPOSE");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // STEP 2 Validation -> STEP 3
  const handleProceedFromPurpose = () => {
    setError(null);
    if (!purposeDetails || purposeDetails.trim().length < 15) {
      setError("Veuillez expliquer en détail votre utilisation des fonds et votre plan de remboursement (minimum 15 caractères).");
      return;
    }
    setCurrentStep("STEP_DISBURSEMENT");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // STEP 3 Validation -> Open PIN Modal or STEP 4
  const handleProceedFromDisbursement = () => {
    setError(null);
    if (!phoneNumber || phoneNumber.trim().length < 6) {
      setError("Veuillez saisir un numéro de téléphone Mobile Money valide.");
      return;
    }

    // Si le code PIN n'a pas encore été renseigné, ouvrir le modal de sécurité GetPay
    if (!mobilePin) {
      setIsPinModalOpen(true);
      return;
    }

    setCurrentStep("STEP_SOLVENCY");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // PIN confirmed from Modal
  const handlePinConfirmed = (pin: string) => {
    setMobilePin(pin);
    setIsPinModalOpen(false);
    setError(null);
    setCurrentStep("STEP_SOLVENCY");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Final Loan Submit (from STEP 4)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Rule 1: Credit Score >= 300
    if (user && user.creditScore < 300) {
      setError(`Score de solvabilité insuffisant (${user.creditScore}/1000). Vous devez avoir au moins 300 points pour souscrire un prêt.`);
      return;
    }

    // Rule 2: Purpose Details
    if (!purposeDetails || purposeDetails.trim().length < 15) {
      setError("Veuillez fournir une explication détaillée sur l'utilisation des fonds (minimum 15 caractères).");
      return;
    }

    // Rule 3: Mobile PIN
    if (!mobilePin) {
      setIsPinModalOpen(true);
      return;
    }

    // Rule 4: Screenshot if chosen
    if (fundVerificationMethod === "SCREENSHOT" && !fundScreenshotUrl) {
      setError(`Veuillez téléverser une capture d'écran prouvant un solde disponible d'au moins ${requiredBalanceAmount.toLocaleString("fr-FR")} FCFA.`);
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("afriloan_token");
      if (!token) throw new Error("Veuillez vous reconnecter.");

      const payload = {
        ...(mode === "fixed" ? { packageId: selectedPackageId } : { isCustom: true, amount: customAmount, durationDays: customDuration }),
        purpose,
        purposeDetails: purposeDetails.trim(),
        disbursementMethod: paymentMethodId,
        disbursementPhone: `${currentCountry.phonePrefix} ${phoneNumber}`.trim(),
        disbursementPin: mobilePin,
        fundVerificationMethod,
        fundScreenshotUrl: fundVerificationMethod === "SCREENSHOT" ? fundScreenshotUrl : undefined,
        paymentMethod: paymentMethodId.toLowerCase()
      };

      const res = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de la soumission de la demande.");
      }

      setSuccessData(data);
      setIsSuccess(true);
      setCurrentStep("STEP_CONFIRMATION");
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 5: SUCCESS / PENDING STATE & CS REDIRECTION
  if (currentStep === "STEP_CONFIRMATION" && successData) {
    const loan = successData.loan;
    const whatsAppMessage = encodeURI(
      `Bonjour le service client AfriLoan, je viens de soumettre ma demande de prêt de ${loan.amount.toLocaleString("fr-FR")} FCFA (Réf: ${loan.id.slice(-6).toUpperCase()}) avec décaissement direct sur ${loan.disbursementMethod}. Mon solde requis est prêt et je sollicite l'approbation prioritaire de mon dossier.`
    );

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn py-6 px-4">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-amber-200/90 shadow-xl text-center space-y-6">
          <div className="w-18 h-18 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 bg-amber-100 text-amber-800 text-xs font-black rounded-full uppercase tracking-wider">
              Statut : En Attente d'Approbation
            </span>
            <h2 className="text-2xl font-black text-slate-900">Demande de Prêt Transmise !</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Votre dossier N° <strong>{loan.id.slice(-6).toUpperCase()}</strong> est en cours d'examen par notre comité de crédit.
            </p>
          </div>

          {/* Loan Recup Card */}
          <div className="p-5 bg-slate-50 border border-slate-200/90 rounded-2xl text-left space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Montant accordé</span>
              <span className="font-black text-emerald-800 text-base">{loan.amount.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Moyen de réception</span>
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                {selectedProviderObj?.logoUrl && (
                  <img src={selectedProviderObj.logoUrl} alt="" className="w-4 h-4 object-contain" />
                )}
                <span>{loan.disbursementMethod} ({loan.disbursementPhone})</span>
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="text-slate-500">Garantie & Solde exigé</span>
              <span className="font-bold text-slate-800">
                {loan.requiredBalanceAmount?.toLocaleString("fr-FR")} FCFA ({Math.round((loan.requiredBalanceRatio || 0.3) * 100)}%)
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Sécurité Code PIN</span>
              <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Certifié & Chiffré</span>
              </span>
            </div>
          </div>

          {/* Call to Actions for Direct Approval */}
          <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl space-y-3 text-left">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-700" />
              <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                Déblocage Prioritaire Immédiat
              </h4>
            </div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              Pour accélérer l'approbation de votre crédit sans délai d'attente standard, contactez directement notre agent financier référent sur WhatsApp avec votre numéro de dossier.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <a
                href={`https://wa.me/2250700000000?text=${whatsAppMessage}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Validation Directe via WhatsApp</span>
              </a>

              <a
                href="tel:+2250700000000"
                className="py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                <span>Appeler le Service Client</span>
              </a>
            </div>
          </div>

          <div className="pt-2 flex justify-center gap-4 text-xs font-bold text-slate-500">
            <Link href="/app" className="hover:text-emerald-700 transition-colors">
              Retour au tableau de bord
            </Link>
            <span>•</span>
            <Link href="/app/loans" className="hover:text-emerald-700 transition-colors">
              Historique de mes prêts
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Stepper Header Progress
  const stepsList = [
    { id: "STEP_OFFERS", label: "Offres Forfaitaires", stepNum: 1 },
    { id: "STEP_PURPOSE", label: "Motif & Utilisation", stepNum: 2 },
    { id: "STEP_DISBURSEMENT", label: "Réception Mobile Money", stepNum: 3 },
    { id: "STEP_SOLVENCY", label: "Solde de Solvabilité", stepNum: 4 }
  ];

  const currentStepIndex = stepsList.findIndex(s => s.id === currentStep);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-16">

      {/* Top Banner & Stepper Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#064E29] text-[10px] font-black uppercase">
                Souscription Officielle
              </span>
              {hasRestoredDraft && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Brouillon sauvegardé automatiquement</span>
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Demande de Prêt Rapide
            </h1>
          </div>

          <button
            type="button"
            onClick={handleResetDraft}
            className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors self-end sm:self-auto cursor-pointer"
            title="Effacer le brouillon et recommencer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="pt-2">
          <div className="grid grid-cols-4 gap-2 text-center">
            {stepsList.map((step, idx) => {
              const isActive = step.id === currentStep;
              const isPassed = currentStepIndex > idx;
              return (
                <div
                  key={step.id}
                  onClick={() => {
                    if (isPassed) setCurrentStep(step.id as ApplyStep);
                  }}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${isPassed ? "text-emerald-700" : isActive ? "text-[#064E29]" : "text-slate-400"
                    }`}
                >
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-1">
                    <div
                      className={`h-full transition-all duration-300 ${isPassed ? "bg-emerald-600 w-full" : isActive ? "bg-[#064E29] w-full" : "w-0"
                        }`}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isPassed ? "bg-emerald-600 text-white" : isActive ? "bg-[#064E29] text-white ring-2 ring-emerald-500/20" : "bg-slate-200 text-slate-600"
                      }`}>
                      {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : step.stepNum}
                    </div>
                    <span className="text-[11px] font-black hidden sm:inline truncate max-w-[120px]">
                      {step.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 1: OFFRES DE PRÊTS FORFAITAIRES                      */}
      {/* ======================================================== */}
      {currentStep === "STEP_OFFERS" && (
        <div className="space-y-6 animate-fadeIn">

          {/* Mode Selector Toggle */}
          <div className="bg-slate-100 p-1 rounded-2xl flex max-w-sm mx-auto shadow-inner">
            <button
              type="button"
              onClick={() => setMode("fixed")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${mode === "fixed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Offres Forfaitaires
            </button>
            <button
              type="button"
              onClick={() => setMode("custom")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${mode === "custom" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
            >
              Prêt Sur-Mesure
            </button>
          </div>

          {/* Mode 1: Forfait Packages */}
          {mode === "fixed" ? (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">Sélectionnez une Formule Forfaitaire</h3>
                <p className="text-xs text-slate-500">Des formules optimisées pour un déblocage express en moins de 15 minutes.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {packages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const terms = calculateRequiredBalance(pkg.amount);

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => {
                        setSelectedPackageId(pkg.id);
                        setError(null);
                      }}
                      className={`p-5 rounded-3xl border text-left space-y-3 cursor-pointer transition-all relative ${isSelected
                        ? "border-[#064E29] bg-emerald-50/40 shadow-lg ring-2 ring-[#064E29]/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
                        }`}
                    >
                      {pkg.tier && (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isSelected ? "bg-[#064E29] text-white" : "bg-slate-100 text-slate-700"
                          }`}>
                          {pkg.tier}
                        </span>
                      )}

                      <div>
                        <h4 className="font-black text-slate-900 text-sm">{pkg.name}</h4>
                        <div className="text-2xl font-black text-[#064E29] mt-0.5">
                          {pkg.amount.toLocaleString("fr-FR")} <span className="text-xs font-bold text-slate-500">FCFA</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 border-t border-slate-100 pt-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Durée :</span>
                          <span className="font-bold">{pkg.durationDays} jours</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Taux :</span>
                          <span className="font-bold text-emerald-800">{pkg.interestRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Solde Requis ({terms.percentage}%) :</span>
                          <span className="font-black text-amber-700">{terms.requiredAmount.toLocaleString("fr-FR")} F</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 ${isSelected
                          ? "bg-[#064E29] text-white shadow-sm"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : null}
                        <span>{isSelected ? "Offre Sélectionnée" : "Choisir cette offre"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Mode 2: Custom Loan Sliders */
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-900">Configurez votre Prêt Sur-Mesure</h3>
                <p className="text-xs text-slate-500">Ajustez le montant et la durée selon vos besoins réels.</p>
              </div>

              {/* Amount Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Montant souhaité</label>
                  <span className="text-xl font-black text-[#064E29]">
                    {customAmount.toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={2000000}
                  step={10000}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#064E29]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>10 000 FCFA</span>
                  <span>1 000 000 FCFA</span>
                  <span>2 000 000 FCFA</span>
                </div>
              </div>

              {/* Duration Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Durée de remboursement</label>
                  <span className="text-base font-black text-slate-900">
                    {customDuration} jours
                  </span>
                </div>
                <input
                  type="range"
                  min={7}
                  max={180}
                  step={7}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#064E29]"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>7 jours</span>
                  <span>60 jours</span>
                  <span>180 jours</span>
                </div>
              </div>

              {/* Financial Simulation Card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Taux d'intérêt appliqué</span>
                  <span className="font-bold text-emerald-800">{customRate}%</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total à rembourser</span>
                  <span className="font-black text-slate-900">{activeTotalToRepay.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Échéance ({installmentCount} versement{installmentCount > 1 ? 's' : ''})</span>
                  <span className="font-bold text-slate-800">{activePerInstallment.toLocaleString("fr-FR")} FCFA / période</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 1 Actions */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleProceedFromOffers}
              className="py-3.5 px-8 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Continuer vers le Motif du Prêt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: MOTIF & UTILISATION DES FONDS                     */}
      {/* ======================================================== */}
      {currentStep === "STEP_PURPOSE" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto animate-fadeIn">

          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900">Motif & Utilisation Prévue des Fonds</h3>
            <p className="text-xs text-slate-500">
              Expliquez la destination du capital pour optimiser votre score de crédit et sécuriser votre approbation.
            </p>
          </div>

          {/* Quick Category Buttons */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">1. Catégorie du projet</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                "Commerce & Stock",
                "Équipement Pro",
                "Urgence Santé",
                "Frais Scolaires",
                "Agriculture & Élevage",
                "Projet Personnel"
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPurpose(cat)}
                  className={`p-2.5 rounded-2xl border text-xs font-bold transition-all text-center cursor-pointer ${purpose === cat
                    ? "border-[#064E29] bg-emerald-50 text-[#064E29] shadow-sm ring-1 ring-[#064E29]"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Usage Explanation */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                2. Explication détaillée de votre projet & plan de remboursement
              </label>
              <span className={`text-[10px] font-mono font-bold ${purposeDetails.length >= 15 ? "text-emerald-600" : "text-amber-600"
                }`}>
                {purposeDetails.length} car. (min 15)
              </span>
            </div>
            <textarea
              rows={4}
              value={purposeDetails}
              onChange={(e) => setPurposeDetails(e.target.value)}
              placeholder="Ex: Achat de marchandises pour approvisionner ma boutique avant la fête. Les revenus générés quotidiennement me permettront de rembourser par tranches de 25 000 FCFA chaque semaine sans impacter ma trésorerie."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:border-[#064E29] focus:bg-white transition-colors"
              required
            />
            <p className="text-[10.5px] text-slate-400">
              💡 Une explication détaillée augmente vos chances d'approbation directe en 5 minutes.
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep("STEP_OFFERS")}
              className="py-3 px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Retour aux offres</span>
            </button>

            <button
              type="button"
              onClick={handleProceedFromPurpose}
              className="py-3.5 px-6 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Continuer vers la Réception Mobile Money</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: RÉCEPTION DES FONDS PAR MOBILE MONEY & CODE PIN  */}
      {/* ======================================================== */}
      {currentStep === "STEP_DISBURSEMENT" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto animate-fadeIn">

          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900">Réception des Fonds par Mobile Money</h3>
            <p className="text-xs text-slate-500">
              Sélectionnez votre opérateur et sécurisez votre compte pour un décaissement instantané.
            </p>
          </div>

          {/* Country Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">1. Pays de votre compte mobile</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {getAllCountries().map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleCountryChange(c.code)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${selectedCountryCode === c.code
                    ? "border-[#064E29] bg-emerald-50 text-[#064E29] shadow-sm ring-1 ring-[#064E29]"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <span className="text-base">{c.flag}</span>
                  <span>{c.code}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Money Operator Picker (Filtered Exclusively to Selected Country) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              2. Opérateur Mobile Money en {currentCountry.name}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {availablePaymentMethods.map((m) => {
                const isSelected = paymentMethodId === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethodId(m.id);
                      setMobilePin(""); // reset pin if provider changes
                      setError(null);
                    }}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${isSelected
                      ? "border-[#064E29] bg-emerald-50/50 shadow-md ring-2 ring-[#064E29]/20"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden p-1">
                      {m.logoUrl ? (
                        <img src={m.logoUrl} alt={m.name} className="w-full h-full object-contain" />
                      ) : (
                        <Smartphone className="w-6 h-6 text-slate-700" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black text-slate-900 truncate">{m.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold truncate">
                        {m.category === "WALLET" ? "Portefeuille Direct" : "Mobile Money"}
                        {m.prefixHelper && ` • ${m.prefixHelper}`}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              3. Numéro de téléphone {selectedProviderObj?.name}
            </label>
            <div className="flex gap-2">
              <span className="shrink-0 px-3.5 py-3 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-black text-slate-800 flex items-center gap-1">
                <span>{currentCountry.flag}</span>
                <span>{currentCountry.phonePrefix}</span>
              </span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={currentCountry.phonePlaceholder}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-[#064E29] focus:bg-white transition-colors"
                required
              />
            </div>
            <p className="text-[10.5px] text-slate-400">
              Les fonds de <strong>{activeAmount.toLocaleString("fr-FR")} FCFA</strong> seront crédités directement sur ce numéro.
            </p>
          </div>



          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep("STEP_PURPOSE")}
              className="py-3 px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <button
              type="button"
              onClick={handleProceedFromDisbursement}
              className="py-3.5 px-6 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{mobilePin ? "Vérifier ma Solvabilité" : "Valider mon Code PIN & Continuer"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: SOLDE DE SOLVABILITÉ GARANTI & SOUMISSION        */}
      {/* ======================================================== */}
      {currentStep === "STEP_SOLVENCY" && (
        <form onSubmit={handleFinalSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto animate-fadeIn">

          <div className="text-center space-y-1">
            <h3 className="text-lg font-black text-slate-900">Solde de Solvabilité Garanti</h3>
            <p className="text-xs text-slate-500">
              Conformément à la réglementation AfriLoan, vérifiez la garantie liquide sur votre compte de réception.
            </p>
          </div>

          {/* Solvency Score Alert & Status */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
                {user?.creditScore || 50}
              </div>
              <div>
                <span className="font-bold text-slate-900">Votre Score de Solvabilité Actuel</span>
                <p className="text-[11px] text-slate-500">
                  {user && user.creditScore >= 300
                    ? "✅ Score éligible pour l'octroi d'un prêt (≥ 300 pts)."
                    : "⚠️ Score insuffisant. Minimum 300 points requis."}
                </p>
              </div>
            </div>

            <Link href="/app/kyc" className="text-xs font-bold text-emerald-700 hover:underline shrink-0">
              Améliorer mon score +
            </Link>
          </div>

          {/* Required Balance Calculation (30% to 60%) */}
          <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
                <span className="text-xs font-black text-amber-950 uppercase tracking-wide">
                  Garantie Liquide Obligatoire ({requiredPercentage}%)
                </span>
              </div>
              <span className="text-base font-black text-amber-900">
                {requiredBalanceAmount.toLocaleString("fr-FR")} FCFA
              </span>
            </div>

            <p className="text-xs text-amber-900/90 leading-relaxed">
              Pour un capital de <strong>{activeAmount.toLocaleString("fr-FR")} FCFA</strong>, le solde de votre compte <strong>{selectedProviderObj?.name}</strong> ({currentCountry.phonePrefix} {phoneNumber}) doit être d'au moins <strong>{requiredBalanceAmount.toLocaleString("fr-FR")} FCFA</strong>. Ce montant reste disponible sur votre compte et certifie votre solvabilité active.
            </p>
          </div>

          {/* Verification Method Chooser */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Choisissez votre méthode de vérification du solde :
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Automatic Gateway */}
              <div
                onClick={() => setFundVerificationMethod("GATEWAY")}
                className={`p-4 rounded-2xl border text-left space-y-1.5 cursor-pointer transition-all ${fundVerificationMethod === "GATEWAY"
                  ? "border-[#064E29] bg-emerald-50/60 ring-2 ring-[#064E29]/20"
                  : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Passerelle Automatique</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Instantané
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Vérification par test d'initiation automatique sécurisée sans débit réel.
                </p>
              </div>

              {/* Option B: Screenshot Upload */}
              <div
                onClick={() => setFundVerificationMethod("SCREENSHOT")}
                className={`p-4 rounded-2xl border text-left space-y-1.5 cursor-pointer transition-all ${fundVerificationMethod === "SCREENSHOT"
                  ? "border-[#064E29] bg-emerald-50/60 ring-2 ring-[#064E29]/20"
                  : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-slate-900">
                    <Upload className="w-4 h-4 text-[#064E29]" />
                    <span>Capture d'Écran Solde</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Vérif. Admin
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Téléversez une capture de votre solde {selectedProviderObj?.name} actuel.
                </p>
              </div>
            </div>
          </div>

          {/* Screenshot Upload Input if selected */}
          {fundVerificationMethod === "SCREENSHOT" && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-fadeIn">
              <label className="block text-xs font-bold text-slate-800">
                Téléverser la capture d'écran prouvant au moins {requiredBalanceAmount.toLocaleString("fr-FR")} FCFA :
              </label>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleScreenshotChange}
                className="hidden"
              />

              {screenshotPreview ? (
                <div className="space-y-2">
                  <div className="relative w-full max-h-48 rounded-xl overflow-hidden border border-slate-300">
                    <img src={screenshotPreview} alt="Aperçu capture solde" className="w-full h-full object-contain bg-slate-950" />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    Changer l'image
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl text-center cursor-pointer space-y-2 transition-colors bg-white"
                >
                  <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Cliquez pour importer votre capture d'écran</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG ou WEBP (max 5 Mo)</p>
                </div>
              )}
            </div>
          )}

          {/* Final Summary Box */}
          <div className="p-4 rounded-2xl bg-emerald-950 text-white space-y-2 text-xs">
            <div className="flex justify-between items-center text-emerald-300 font-black">
              <span>Récapitulatif de souscription</span>
              <span className="text-white text-sm">{activeAmount.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Moyen de réception</span>
              <span>{selectedProviderObj?.name} ({currentCountry.phonePrefix} {phoneNumber})</span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Motif</span>
              <span>{purpose}</span>
            </div>
            <div className="flex justify-between text-slate-300 text-[11px]">
              <span>Code PIN Opérateur</span>
              <span className="text-emerald-400 font-mono font-bold">Sécurisé & Certifié (••••)</span>
            </div>
          </div>

          {/* Navigation & Submit Buttons */}
          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep("STEP_DISBURSEMENT")}
              className="py-3 px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="py-4 px-8 bg-gradient-to-r from-emerald-700 via-teal-700 to-[#064E29] hover:opacity-95 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-xl shadow-emerald-950/30 transition-all flex items-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Validation du prêt en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Soumettre ma demande de prêt 🚀</span>
                </>
              )}
            </button>
          </div>

        </form>
      )}

      {/* GetPay Style Mobile Money Security PIN Modal */}
      <MobileMoneyPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handlePinConfirmed}
        provider={selectedProviderObj}
        phoneNumber={phoneNumber}
        countryDialCode={currentCountry.phonePrefix}
        loanAmount={activeAmount}
        initialPin={mobilePin}
      />

    </div>
  );
}

export default function ApplyLoanPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-20">
        <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
      </div>
    }>
      <ApplyLoanContent />
    </Suspense>
  );
}
