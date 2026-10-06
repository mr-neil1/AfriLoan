"use client";

import { useEffect, useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  Camera, 
  Video, 
  Eye, 
  AlertCircle,
  X,
  ExternalLink,
  MapPin,
  Building2,
  Award,
  User,
  Check,
  Zap,
  FolderOpen,
  Layers,
  Phone,
  Mail,
  ChevronRight,
  Play,
  CreditCard,
  Edit3,
  EyeOff
} from "lucide-react";
import AdminCardEditModal from "@/components/admin/AdminCardEditModal";

export default function AdminKycPage() {
  const [viewMode, setViewMode] = useState<"DOSSIERS" | "DOCUMENTS">("DOSSIERS");
  const [documents, setDocuments] = useState<any[]>([]);
  const [dossiers, setDossiers] = useState<any[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, dossiersCount: 0 });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Card edit modal state
  const [cardToEdit, setCardToEdit] = useState<any | null>(null);
  const [cardUserName, setCardUserName] = useState<string>("");
  const [isCardEditOpen, setIsCardEditOpen] = useState(false);

  // Inspection modal
  const [selectedDoc, setSelectedDoc] = useState<any | null>(null);

  // Reject modal
  const [rejectingDocId, setRejectingDocId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchKycData();
  }, [statusFilter]);

  const fetchKycData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch(`/api/admin/kyc?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setDocuments(json.documents || []);
        setDossiers(json.dossiers || []);
        if (json.counts) setCounts(json.counts);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  // 1-CLICK DOSSIER APPROVAL
  const handleApproveEntireDossier = async (userId: string, userName: string) => {
    if (!confirm(`Confirmez-vous la validation intégrale du dossier de ${userName} en 1 clic ?\nTous les documents KYC et comptes seront approuvés et le score de solvabilité sera augmenté.`)) {
      return;
    }

    setProcessingUserId(userId);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          action: "APPROVE_DOSSIER",
          userId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de validation");

      alert(`✅ ${data.message}`);
      fetchKycData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setProcessingUserId(null);
    }
  };

  // INDIVIDUAL DOCUMENT APPROVAL
  const handleApproveDoc = async (docId: string) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: docId,
          status: "APPROVED"
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur de validation");
      }

      fetchKycData();
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReject = (docId: string) => {
    setRejectingDocId(docId);
    setRejectReason("Document non conforme ou illisible.");
  };

  const handleConfirmReject = async () => {
    if (!rejectingDocId) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/kyc", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: rejectingDocId,
          status: "REJECTED",
          adminNote: rejectReason
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors du rejet");
      }

      setRejectingDocId(null);
      setRejectReason("");
      fetchKycData();
      if (selectedDoc?.id === rejectingDocId) setSelectedDoc(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredDossiers = dossiers.filter((dos) => {
    const q = search.toLowerCase();
    return (
      dos.name?.toLowerCase().includes(q) ||
      dos.email?.toLowerCase().includes(q) ||
      dos.phone?.toLowerCase().includes(q) ||
      dos.city?.toLowerCase().includes(q)
    );
  });

  const filteredDocs = documents.filter((doc) => {
    const q = search.toLowerCase();
    return (
      doc.user?.name?.toLowerCase().includes(q) ||
      doc.user?.email?.toLowerCase().includes(q) ||
      doc.user?.phone?.toLowerCase().includes(q) ||
      doc.documentType?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064E29] rounded-full text-xs font-bold mb-1 border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Contrôle & Conformité KYC Client</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Dossiers de Vérification KYC</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Examen approfondi des identités, justificatifs, selfies, vidéos KYC, comptes bancaires et adresses de domicile.
          </p>
        </div>

        <button
          onClick={fetchKycData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900">{counts.dossiersCount || dossiers.length}</div>
            <div className="text-[11px] font-bold text-slate-400">Dossiers Clients</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-amber-700">{counts.pending}</div>
            <div className="text-[11px] font-bold text-slate-400">Pièces En Attente</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#064E29] flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-[#064E29]">{counts.approved}</div>
            <div className="text-[11px] font-bold text-slate-400">Pièces Validées</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-black text-rose-700">{counts.rejected}</div>
            <div className="text-[11px] font-bold text-slate-400">Pièces Rejetées</div>
          </div>
        </div>
      </div>

      {/* Control Bar: View Toggle & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Toggle View Mode */}
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setViewMode("DOSSIERS")}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              viewMode === "DOSSIERS"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FolderOpen className="w-4 h-4 text-[#064E29]" />
            <span>Vue par Dossier Client ({filteredDossiers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("DOCUMENTS")}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
              viewMode === "DOCUMENTS"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4 text-[#064E29]" />
            <span>Vue par Pièce Unitaire ({filteredDocs.length})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par client, ville, email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
          />
        </div>
      </div>

      {/* MAIN VIEW: DOSSIERS CLIENT */}
      {viewMode === "DOSSIERS" ? (
        <div className="space-y-6">
          {isLoading ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-slate-200">
              <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
            </div>
          ) : filteredDossiers.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
              <FolderOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Aucun dossier client trouvé</p>
            </div>
          ) : (
            filteredDossiers.map((dos) => {
              const pendingCount = (dos.kycDocuments || []).filter((d: any) => d.status === "PENDING").length;
              const hasBank = (dos.bankAccounts || []).length > 0;
              const hasCards = (dos.bankCards || []).length > 0;
              const isVerified = dos.kycStatus === "VERIFIED";

              return (
                <div 
                  key={dos.id} 
                  className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Dossier Header */}
                  <div className="p-5 border-b border-slate-100 bg-slate-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-base flex items-center justify-center shadow-sm shrink-0">
                        {dos.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-black text-slate-900">{dos.name}</h2>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                            isVerified 
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : pendingCount > 0 
                              ? "bg-amber-100 text-amber-800 border border-amber-300" 
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {isVerified ? "✓ DOSSIER CERTIFIÉ" : pendingCount > 0 ? `⏳ ${pendingCount} À VÉRIFIER` : "INCOMPLET"}
                          </span>
                          {hasCards && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              <CreditCard className="w-3 h-3 text-amber-700" />
                              <span>{dos.bankCards.length} Carte(s)</span>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-mono"><Phone className="w-3 h-3" /> {dos.phone || "N/A"}</span>
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {dos.email}</span>
                          <span>Pays : <strong>{dos.countryCode || "CI"}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right side stats & 1-CLICK MASTER BUTTON */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-right pr-2 hidden sm:block">
                        <div className="text-xs font-black text-[#064E29]">Score : {dos.creditScore} / 1000</div>
                        <div className="text-[10px] text-slate-400 font-semibold">Plafond : {dos.creditLimit?.toLocaleString("fr-FR")} FCFA</div>
                      </div>

                      {/* 1-CLICK APPROVAL BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleApproveEntireDossier(dos.id, dos.name)}
                        disabled={processingUserId === dos.id || (isVerified && pendingCount === 0)}
                        className="px-4 py-2.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingUserId === dos.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Tout Valider en 1 Clic</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Dossier Body */}
                  <div className="p-6 space-y-5">
                    
                    {/* Demographics & Profile Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Profession</span>
                        <p className="font-extrabold text-slate-800">{dos.profession || "Non renseignée"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Revenu Mensuel</span>
                        <p className="font-extrabold text-[#064E29]">{dos.monthlyIncome ? `${dos.monthlyIncome.toLocaleString("fr-FR")} FCFA` : "Non spécifié"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Ville & Quartier</span>
                        <p className="font-extrabold text-slate-800">{dos.city || "Abidjan"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Adresse / GPS</span>
                        <p className="font-extrabold text-slate-800 flex items-center gap-1 truncate">
                          {dos.latitude ? (
                            <a 
                              href={`https://www.google.com/maps?q=${dos.latitude},${dos.longitude}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-emerald-700 hover:underline flex items-center gap-0.5"
                            >
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span>GPS Certifié</span>
                            </a>
                          ) : (
                            dos.address || "Adresse non fournie"
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Linked Bank Accounts in Dossier */}
                    {hasBank && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-black text-slate-900">
                          <Building2 className="w-4 h-4 text-[#064E29]" />
                          <span>Comptes Bancaires Certifiés ({dos.bankAccounts.length})</span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {dos.bankAccounts.map((b: any) => (
                            <div key={b.id} className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs gap-3">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-white border border-emerald-200 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                                  {b.bankLogo ? (
                                    <img src={b.bankLogo} alt={b.bankName} className="w-full h-full object-contain" />
                                  ) : (
                                    <Building2 className="w-4 h-4 text-emerald-700" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <span className="font-black text-slate-900 truncate block">{b.bankName}</span>
                                  <p className="font-mono text-[11px] text-[#064E29] font-bold truncate">{b.accountNumber}</p>
                                  {b.onlineBankingId && (
                                    <p className="text-[10px] text-slate-500 truncate">ID: {b.onlineBankingId} ({b.onlineBankingName || "E-Banking"})</p>
                                  )}
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                                {b.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Linked Bank Cards in Dossier */}
                    {hasCards && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-black text-slate-900">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-[#064E29]" />
                            <span>Cartes Bancaires Enregistrées ({dos.bankCards.length})</span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">
                            Données vérifiées de solvabilité & modifications
                          </span>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                          {dos.bankCards.map((c: any) => (
                            <AdminCardRow 
                              key={c.id} 
                              card={c} 
                              onEdit={() => {
                                setCardToEdit(c);
                                setCardUserName(dos.name);
                                setIsCardEditOpen(true);
                              }} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* KYC Documents & Media Items Grid */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-black text-slate-900">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-[#064E29]" />
                          <span>Pièces Justificatives, Photos & Vidéos KYC ({dos.kycDocuments?.length || 0})</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          Cliquez pour examiner en plein écran
                        </span>
                      </div>

                      {(!dos.kycDocuments || dos.kycDocuments.length === 0) ? (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
                          Aucun document KYC téléversé pour l'instant.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {dos.kycDocuments.map((doc: any) => {
                            const isPending = doc.status === "PENDING";
                            const isApproved = doc.status === "APPROVED";
                            const isVideo = doc.mediaType === "VIDEO" || doc.fileData?.startsWith("data:video");

                            return (
                              <div 
                                key={doc.id}
                                className={`rounded-2xl border p-3 flex flex-col justify-between transition-all bg-white ${
                                  isPending ? "border-amber-300 ring-1 ring-amber-200" : isApproved ? "border-emerald-200" : "border-rose-200"
                                }`}
                              >
                                <div>
                                  {/* Media Thumbnail */}
                                  <div 
                                    onClick={() => setSelectedDoc(doc)}
                                    className="relative w-full h-32 bg-slate-100 rounded-xl overflow-hidden cursor-pointer group flex items-center justify-center border border-slate-200"
                                  >
                                    {isVideo ? (
                                      <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-900 text-white">
                                        <Play className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform" />
                                        <span className="text-[10px] font-bold mt-1">Vidéo KYC</span>
                                      </div>
                                    ) : doc.fileData ? (
                                      <img 
                                        src={doc.fileData} 
                                        alt={doc.documentType} 
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <div className="text-slate-400 text-xs">Aperçu indisponible</div>
                                    )}

                                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                      <Eye className="w-5 h-5" />
                                    </div>
                                  </div>

                                  <div className="mt-2.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-black text-xs text-slate-900 truncate">
                                        {doc.documentType}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                                        isApproved ? "bg-emerald-100 text-emerald-800" : isPending ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                      }`}>
                                        {doc.status}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      Source : {doc.captureSource || "UPLOAD"}
                                    </span>
                                  </div>
                                </div>

                                {/* Granular Item Actions (Valider / Rejeter 1 par 1) */}
                                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-100">
                                  {isPending ? (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => handleApproveDoc(doc.id)}
                                        disabled={isProcessing}
                                        className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg transition-colors flex items-center justify-center gap-1"
                                      >
                                        <Check className="w-3 h-3 stroke-[3]" />
                                        <span>Valider</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleOpenReject(doc.id)}
                                        disabled={isProcessing}
                                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                                      >
                                        <X className="w-3 h-3" />
                                        <span>Rejeter</span>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedDoc(doc)}
                                      className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Examiner</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        
        /* SECONDARY VIEW: INDIVIDUAL DOCUMENTS TABLE */
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Client</th>
                  <th className="p-4">Type Document</th>
                  <th className="p-4">Format / Source</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4">Date de soumission</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900">{doc.user?.name}</div>
                      <div className="text-[10px] text-slate-400">{doc.user?.phone || doc.user?.email}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {doc.documentType}
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-slate-600">{doc.mediaType} ({doc.captureSource})</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        doc.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : doc.status === "PENDING"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(doc.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDoc(doc)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg"
                        >
                          Voir
                        </button>
                        {doc.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveDoc(doc.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                            >
                              Valider
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenReject(doc.id)}
                              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-lg"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL (IMAGE & VIDEO VIEWER) */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-900">{selectedDoc.documentType}</h3>
                <p className="text-[11px] text-slate-500">Client : {selectedDoc.user?.name}</p>
              </div>
              <button 
                onClick={() => setSelectedDoc(null)} 
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-950">
              {selectedDoc.mediaType === "VIDEO" || selectedDoc.fileData?.startsWith("data:video") ? (
                <video 
                  controls 
                  autoPlay 
                  src={selectedDoc.fileData} 
                  className="max-h-[60vh] max-w-full rounded-xl"
                />
              ) : selectedDoc.fileData ? (
                <img 
                  src={selectedDoc.fileData} 
                  alt="Aperçu document" 
                  className="max-h-[60vh] max-w-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-white text-xs">Aucun média associé</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <span className={`px-3 py-1 rounded-full text-xs font-black ${
                selectedDoc.status === "APPROVED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                Statut : {selectedDoc.status}
              </span>

              {selectedDoc.status === "PENDING" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenReject(selectedDoc.id)}
                    className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl"
                  >
                    Rejeter
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApproveDoc(selectedDoc.id)}
                    className="px-4 py-2 bg-[#064E29] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md"
                  >
                    Valider le document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <h3 className="text-sm font-black text-slate-900">Motif du rejet du document</h3>
            <p className="text-xs text-slate-500">
              Ce message sera notifié au client afin qu'il reprenne une photo ou vidéo conforme.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
            />
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingDocId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl"
              >
                Confirmer le rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Card Edit Modal */}
      <AdminCardEditModal
        card={cardToEdit}
        userName={cardUserName}
        isOpen={isCardEditOpen}
        onClose={() => setIsCardEditOpen(false)}
        onUpdated={fetchKycData}
      />

    </div>
  );
}

function AdminCardRow({ card, onEdit }: { card: any; onEdit: () => void }) {
  const [showFull, setShowFull] = useState(false);
  const [showCvc, setShowCvc] = useState(false);

  const cleanNum = (card.cardNumber || "").replace(/\s+/g, "");
  const masked = cleanNum.length >= 8 
    ? `${cleanNum.slice(0, 4)} •••• •••• ${cleanNum.slice(-4)}`
    : "•••• •••• •••• ••••";

  return (
    <div className="p-3 bg-slate-900 text-white rounded-2xl border border-slate-700 space-y-2 text-xs shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold">
          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-black text-amber-300">{card.cardBrand || "CARTE"}</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 rounded font-mono text-slate-400">
            {card.cardType || "DEBIT"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
            card.status === "VERIFIED" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" :
            card.status === "SUSPENDED" ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
            "bg-amber-500/20 text-amber-300 border border-amber-500/40"
          }`}>
            {card.status}
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Modifier ou supprimer cette carte"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between font-mono text-xs">
        <span className="font-bold tracking-wider text-slate-100 select-all">
          {showFull ? card.cardNumber : masked}
        </span>
        <button
          type="button"
          onClick={() => setShowFull(!showFull)}
          className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5 ml-2 cursor-pointer shrink-0"
        >
          {showFull ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          <span>{showFull ? "Masquer" : "Afficher"}</span>
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1.5 border-t border-slate-800">
        <div className="truncate pr-2">
          <span className="text-slate-400 text-[10px] block">Titulaire :</span>
          <strong className="text-white truncate block">{card.cardHolder}</strong>
        </div>
        <div className="text-right shrink-0">
          <span className="text-slate-400 text-[10px] block">Exp / CVC :</span>
          <span className="font-mono text-amber-300 font-bold">
            {card.expiryMonth}/{card.expiryYear}
          </span>
          <span className="text-slate-300 font-mono ml-2">
            CVC:{" "}
            <strong 
              onClick={() => setShowCvc(!showCvc)} 
              className="text-white cursor-pointer hover:underline bg-slate-800 px-1 py-0.5 rounded text-[10px]"
              title="Cliquer pour afficher/masquer le code CVC"
            >
              {showCvc ? card.cvc : "•••"}
            </strong>
          </span>
        </div>
      </div>
    </div>
  );
}
