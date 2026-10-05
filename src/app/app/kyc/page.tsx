"use client";

import { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Camera, 
  Video, 
  Building2, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Lock,
  ExternalLink,
  Sparkles,
  RefreshCw
} from "lucide-react";
import CameraCaptureModal from "@/components/kyc/CameraCaptureModal";
import BankLinkModal from "@/components/banks/BankLinkModal";
import HomeLocationPicker from "@/components/location/HomeLocationPicker";
import CreditScoreWidget from "@/components/kyc/CreditScoreWidget";

export default function KycVerificationPage() {
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [scoreBreakdown, setScoreBreakdown] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [activeDocType, setActiveDocType] = useState<"CNI_RECTO" | "CNI_VERSO" | "SELFIE_PHOTO" | "KYC_VIDEO" | "PASSPORT">("CNI_RECTO");
  const [bankModalOpen, setBankModalOpen] = useState(false);

  // Profile employment & emergency form states
  const [profession, setProfession] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState<number | string>("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRel, setEmergencyRel] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchKycData();
  }, []);

  const fetchKycData = async () => {
    try {
      const token = localStorage.getItem("afriloan_token");
      if (!token) {
        window.location.href = "/auth";
        return;
      }

      const [meRes, kycRes, bankRes] = await Promise.all([
        fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/kyc", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/banks", { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (meRes.ok) {
        const meData = await meRes.json();
        setUser(meData.user);
        setProfession(meData.user.profession || "");
        setMonthlyIncome(meData.user.monthlyIncome || "");
        setEmergencyName(meData.user.emergencyContactName || "");
        setEmergencyPhone(meData.user.emergencyContactPhone || "");
        setEmergencyRel(meData.user.emergencyContactRel || "");
      }

      if (kycRes.ok) {
        const kycData = await kycRes.json();
        setDocuments(kycData.documents || []);
        setScoreBreakdown(kycData.breakdown || null);
      }

      if (bankRes.ok) {
        const bankData = await bankRes.json();
        setBankAccounts(bankData.accounts || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCapture = (type: "CNI_RECTO" | "CNI_VERSO" | "SELFIE_PHOTO" | "KYC_VIDEO" | "PASSPORT") => {
    setActiveDocType(type);
    setCameraModalOpen(true);
  };

  const handleDocumentCaptured = async (
    fileData: string, 
    mediaType: "IMAGE" | "VIDEO", 
    captureSource: "WEBCAM" | "UPLOAD" | "LIVE_RECORDING"
  ) => {
    const token = localStorage.getItem("afriloan_token");
    const res = await fetch("/api/kyc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        documentType: activeDocType,
        mediaType,
        fileData,
        captureSource
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur lors de l'envoi du document");
    }

    await fetchKycData();
  };

  const handleDeleteBank = async (bankId: string) => {
    if (!confirm("Voulez-vous vraiment délier ce compte bancaire ?")) return;
    try {
      const token = localStorage.getItem("afriloan_token");
      await fetch(`/api/banks?id=${bankId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchKycData();
    } catch (e) {
      // ignore
    }
  };

  const handleSaveProfileAndEmergency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          profession,
          monthlyIncome: monthlyIncome ? Number(monthlyIncome) : null,
          emergencyContactName: emergencyName,
          emergencyContactPhone: emergencyPhone,
          emergencyContactRel: emergencyRel
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la sauvegarde");

      setProfileMessage("Informations enregistrées avec succès ! Score actualisé.");
      fetchKycData();
    } catch (err: any) {
      setProfileMessage(err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-24">
        <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
      </div>
    );
  }

  // Find doc by type
  const docCniRecto = documents.find(d => d.documentType === "CNI_RECTO");
  const docCniVerso = documents.find(d => d.documentType === "CNI_VERSO");
  const docSelfie = documents.find(d => d.documentType === "SELFIE_PHOTO");
  const docVideo = documents.find(d => d.documentType === "KYC_VIDEO");

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-16 px-1 sm:px-0">
      
      {/* Header */}
      <div className="bg-white p-5 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064E29] rounded-full text-xs font-bold mb-2 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Sécurité & Conformité Réglementaire</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
            Centre de Vérification KYC & Solvabilité
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Complétez vos pièces d'identité, votre localisation et votre liaison bancaire pour augmenter votre score de solvabilité et débloquer des montants de prêt plus élevés.
          </p>
        </div>

        <button
          onClick={fetchKycData}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl w-full sm:w-auto transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Credit Score Dynamic Widget */}
      <CreditScoreWidget
        score={user?.creditScore || 50}
        creditLimit={user?.creditLimit || 10000}
        currencySymbol={user?.currency === "CDF" ? "FC" : "FCFA"}
        breakdown={scoreBreakdown}
        onActionClick={(actionId) => {
          if (actionId === "CNI_DOCUMENT") handleOpenCapture("CNI_RECTO");
          if (actionId === "SELFIE_PHOTO") handleOpenCapture("SELFIE_PHOTO");
          if (actionId === "KYC_VIDEO") handleOpenCapture("KYC_VIDEO");
          if (actionId === "BANK_ACCOUNT") setBankModalOpen(true);
        }}
      />

      {/* SECTION 1: Identity Documents & Live Capture (CNI, Selfie, Video) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5 sm:space-y-6">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900">
            1. Pièces d'Identité & Vérification de Vivacité en Direct
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Prenez vos photos et enregistrez votre vidéo directement sur la plateforme AfriLoan via votre caméra.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          
          {/* CNI Recto */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">CNI Recto</span>
                {docCniRecto ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    docCniRecto.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                    docCniRecto.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {docCniRecto.status === "APPROVED" ? "Approuvé" : docCniRecto.status === "REJECTED" ? "Rejeté" : "En cours"}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">Requis</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Face avant de votre carte nationale ou passeport</p>
            </div>

            {docCniRecto ? (
              <div className="space-y-2">
                <div className="h-36 sm:h-28 w-full bg-slate-200 rounded-xl overflow-hidden shadow-inner">
                  <img src={docCniRecto.fileData} alt="CNI Recto" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCapture("CNI_RECTO")}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Reprendre la photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenCapture("CNI_RECTO")}
                className="w-full py-3.5 bg-[#064E29] hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Prendre / Importer</span>
              </button>
            )}
          </div>

          {/* CNI Verso */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">CNI Verso</span>
                {docCniVerso ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    docCniVerso.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" :
                    docCniVerso.status === "REJECTED" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {docCniVerso.status === "APPROVED" ? "Approuvé" : docCniVerso.status === "REJECTED" ? "Rejeté" : "En cours"}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">Requis</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Face arrière de votre carte d'identité</p>
            </div>

            {docCniVerso ? (
              <div className="space-y-2">
                <div className="h-36 sm:h-28 w-full bg-slate-200 rounded-xl overflow-hidden shadow-inner">
                  <img src={docCniVerso.fileData} alt="CNI Verso" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCapture("CNI_VERSO")}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Reprendre la photo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenCapture("CNI_VERSO")}
                className="w-full py-3.5 bg-[#064E29] hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Prendre / Importer</span>
              </button>
            )}
          </div>

          {/* Selfie Photo */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">Photo Selfie</span>
                {docSelfie ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    docSelfie.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {docSelfie.status === "APPROVED" ? "Approuvé" : "En cours"}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#064E29]">+50 pts</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Selfie pris avec la caméra en direct</p>
            </div>

            {docSelfie ? (
              <div className="space-y-2">
                <div className="h-36 sm:h-28 w-full bg-slate-200 rounded-xl overflow-hidden shadow-inner">
                  <img src={docSelfie.fileData} alt="Selfie" className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCapture("SELFIE_PHOTO")}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Reprendre le selfie
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenCapture("SELFIE_PHOTO")}
                className="w-full py-3.5 bg-[#064E29] hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Prendre mon selfie</span>
              </button>
            )}
          </div>

          {/* KYC Video */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">Vidéo de Vivacité</span>
                {docVideo ? (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    docVideo.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                  }`}>
                    {docVideo.status === "APPROVED" ? "Approuvé" : "En cours"}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-[#064E29]">+100 pts</span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">Vidéo de 5-8s enregistrée sur AfriLoan</p>
            </div>

            {docVideo ? (
              <div className="space-y-2">
                <div className="h-36 sm:h-28 w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                  <video src={docVideo.fileData} className="w-full h-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenCapture("KYC_VIDEO")}
                  className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Réenregistrer la vidéo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenCapture("KYC_VIDEO")}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:opacity-90 active:scale-[0.98] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Enregistrer la vidéo</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* SECTION 2: Home Location Picker (Google Maps) */}
      <HomeLocationPicker
        initialAddress={user?.address || ""}
        initialCity={user?.city || ""}
        initialCountryCode={user?.countryCode || "CI"}
        initialLat={user?.latitude}
        initialLng={user?.longitude}
        onLocationSaved={fetchKycData}
      />

      {/* SECTION 3: Linked Bank Accounts */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              2. Compte Bancaire Lié & Connexion Directe
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Associez votre compte bancaire (Afriland First Bank, SGCI, Rawbank, BGFIBank...) pour sécuriser vos remboursements (+150 pts).
            </p>
          </div>

          <button
            type="button"
            onClick={() => setBankModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#064E29] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-sm shrink-0 w-full sm:w-auto transition-transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lier une banque</span>
          </button>
        </div>

        {bankAccounts.length === 0 ? (
          <div className="p-6 sm:p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Aucun compte bancaire lié pour le moment</p>
            <p className="text-[11px] text-slate-400">
              La liaison d'une banque partenaire augmente instantanément votre score de <strong>+150 points</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {bankAccounts.map((acc) => (
              <div 
                key={acc.id}
                className="p-4 sm:p-5 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/40 space-y-3 relative"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-black text-[#064E29] truncate">{acc.bankName}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                    Connecté & Sécurisé
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <div className="text-slate-600 font-semibold break-all">
                    N° de compte : <span className="font-mono font-bold text-slate-900">{acc.accountNumber}</span>
                  </div>
                  {acc.accountHolder && (
                    <div className="text-slate-500 text-[11px] truncate">
                      Titulaire : <span className="font-medium text-slate-700">{acc.accountHolder}</span>
                    </div>
                  )}
                  <div className="text-slate-500 text-[11px] flex items-center gap-1">
                    <Lock className="w-3 h-3 text-emerald-700 shrink-0" />
                    <span className="truncate">Accès : {acc.maskedPassword}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleDeleteBank(acc.id)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 p-1 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Délier</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: Professional & Emergency Contact */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-900">
            3. Situation Professionnelle & Contact de Confiance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Ces renseignements permettent de finaliser le calcul de votre capacité de remboursement (+100 pts cumulés).
          </p>
        </div>

        {profileMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{profileMessage}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfileAndEmergency} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Profession / Métier exercé
              </label>
              <input
                type="text"
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                placeholder="Ex: Commerçant, Enseignant, Cadre, Artisan..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#064E29]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Revenu mensuel estimé ({user?.currency === "CDF" ? "FC" : "FCFA"})
              </label>
              <input
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="Ex: 250000"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#064E29]"
              />
            </div>
          </div>

          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Personne de Référence / Contact d'Urgence</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom complet du proche</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Nom & prénom"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Lien de parenté</label>
                <input
                  type="text"
                  value={emergencyRel}
                  onChange={(e) => setEmergencyRel(e.target.value)}
                  placeholder="Ex: Conjoint, Frère, Collègue..."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Téléphone joignable</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+225 07 00 00 00 00"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 active:scale-[0.99] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSavingProfile ? <span className="loading loading-spinner loading-sm"></span> : "Enregistrer mes informations"}
          </button>
        </form>
      </div>

      {/* Modals */}
      <CameraCaptureModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        documentType={activeDocType}
        onCaptured={handleDocumentCaptured}
      />

      <BankLinkModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        userCountryCode={user?.countryCode || "CI"}
        onBankLinked={() => fetchKycData()}
      />

    </div>
  );
}
