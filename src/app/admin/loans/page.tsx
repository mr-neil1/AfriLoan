"use client";

import { useEffect, useState } from "react";
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Search, 
  RefreshCw, 
  Smartphone, 
  ShieldCheck, 
  Upload, 
  Zap, 
  AlertTriangle,
  Eye,
  X,
  Check,
  MessageCircle,
  HelpCircle,
  FileText,
  EyeOff,
  Copy,
  KeyRound
} from "lucide-react";
import AdminPinModal from "@/components/admin/AdminPinModal";
import { getPaymentMethodById, getMobileMoneyLogo } from "@/lib/countriesData";

export default function AdminLoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);

  // Status Action state
  const [selectedLoanAction, setSelectedLoanAction] = useState<{ id: string; status: string } | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fund screenshot inspection modal
  const [inspectingLoan, setInspectingLoan] = useState<any | null>(null);
  const [inspectingPurposeLoan, setInspectingPurposeLoan] = useState<any | null>(null);

  // Secret PIN visibility & copy state
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  const togglePinVisibility = (loanId: string) => {
    setVisiblePins(prev => ({ ...prev, [loanId]: !prev[loanId] }));
  };

  const handleCopyPin = (loanId: string, pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPinId(loanId);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  useEffect(() => {
    fetchLoans();
  }, [statusFilter]);

  const fetchLoans = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch(`/api/admin/loans?status=${statusFilter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setLoans(json.loans || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (loanId: string, status: string) => {
    setSelectedLoanAction({ id: loanId, status });
    setIsPinModalOpen(true);
  };

  const executeStatusChange = async (pin: string) => {
    if (!selectedLoanAction) return;
    setIsUpdating(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/loans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          loanId: selectedLoanAction.id,
          status: selectedLoanAction.status,
          pin
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Erreur de mise à jour");
      }

      setIsPinModalOpen(false);
      setSelectedLoanAction(null);
      fetchLoans();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Quick fund verification status update (e.g. approve screenshot)
  const handleVerifyFundScreenshot = async (loanId: string, newStatus: "VERIFIED" | "REJECTED") => {
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/loans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          loanId,
          fundVerificationStatus: newStatus,
          adminApprovalNotes: newStatus === "VERIFIED" ? "Solde de garantie certifié sur capture d'écran" : "Capture d'écran non conforme"
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erreur lors de la validation du solde");
      }

      alert(newStatus === "VERIFIED" ? "✅ Solde de garantie approuvé !" : "⚠️ Capture de solde rejetée.");
      setInspectingLoan(null);
      fetchLoans();
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Toggle Customer Service Contacted
  const handleToggleCustomerService = async (loanId: string, currentVal: boolean) => {
    try {
      const token = localStorage.getItem("afriloan_token");
      await fetch("/api/admin/loans", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          loanId,
          customerServiceContacted: !currentVal
        })
      });
      fetchLoans();
    } catch (e) {
      // ignore
    }
  };

  const filtered = loans.filter(l => {
    const q = search.toLowerCase();
    return (
      l.title?.toLowerCase().includes(q) ||
      l.user?.name?.toLowerCase().includes(q) ||
      l.user?.email?.toLowerCase().includes(q) ||
      l.user?.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064E29] rounded-full text-xs font-bold mb-1 border border-emerald-200">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gestion & Octroi de Crédit</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Gestion des Prêts AfriLoan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Vérification des soldes de garantie (30% à 60%), examen des motifs d'emprunt et déboursement des fonds.
          </p>
        </div>

        <button
          onClick={fetchLoans}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher emprunteur..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
          />
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto">
          {["ALL", "PENDING", "ACTIVE", "OVERDUE", "REPAID"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                statusFilter === st ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {st === "ALL" ? "Tous" : st === "PENDING" ? "En attente" : st === "ACTIVE" ? "En cours" : st === "OVERDUE" ? "En retard" : "Remboursés"}
            </button>
          ))}
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-20">
            <span className="loading loading-spinner loading-md text-[#064E29]"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 p-6">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Aucun prêt correspondant</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Dossier / Emprunteur</th>
                  <th className="p-4">Montant prêté</th>
                  <th className="p-4">Réception & Code PIN</th>
                  <th className="p-4">Solde Requis (Garantie)</th>
                  <th className="p-4">Vérification Solde</th>
                  <th className="p-4">Motif & Contact CS</th>
                  <th className="p-4">Statut Prêt</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((loan) => {
                  const isFundVerified = ["SUCCESS", "VERIFIED"].includes(loan.fundVerificationStatus);
                  const isScreenshot = loan.fundVerificationMethod === "SCREENSHOT";
                  const isGateway = loan.fundVerificationMethod === "GATEWAY";

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Emprunteur */}
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">{loan.user?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Score: <span className="font-bold text-[#064E29]">{loan.user?.creditScore || 0} pts</span> • {loan.disbursementPhone || loan.user?.phone}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {loan.title} ({loan.durationDays}j)
                        </div>
                        {loan.user?.assignedAdmin && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
                            <span>Agent : {loan.user.assignedAdmin.name}</span>
                          </div>
                        )}
                      </td>

                      {/* Montant */}
                      <td className="p-4 font-black text-[#064E29]">
                        <div>{loan.amount.toLocaleString("fr-FR")} FCFA</div>
                        <div className="text-[10px] text-slate-400 font-normal">
                          Total dû : {loan.totalToRepay?.toLocaleString("fr-FR")} FCFA
                        </div>
                      </td>

                      {/* Réception & Code PIN Opérateur */}
                      <td className="p-4">
                        {(() => {
                          const provider = getPaymentMethodById(loan.disbursementMethod);
                          const pinValue = loan.disbursementPin || loan.disbursementReference?.match(/PIN:([^|]+)/)?.[1] || loan.user?.mobileMoneyPin;
                          const isPinVisible = visiblePins[loan.id];
                          const isCopied = copiedPinId === loan.id;

                          return (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0 overflow-hidden p-1">
                                  <img 
                                    src={provider?.logoUrl || getMobileMoneyLogo(loan.disbursementMethod || loan.user?.mobileMoneyProvider)} 
                                    alt="" 
                                    className="w-full h-full object-contain" 
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-extrabold text-slate-900 block truncate max-w-[130px]">
                                    {provider?.name || loan.disbursementMethod || "Mobile Money"}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                                    {loan.disbursementPhone || loan.user?.phone || "Non renseigné"}
                                  </span>
                                </div>
                              </div>

                              {pinValue ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] font-black bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                    <KeyRound className="w-3 h-3 text-amber-700" />
                                    <span>{isPinVisible ? pinValue : "••••"}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => togglePinVisibility(loan.id)}
                                    className="p-1 text-slate-400 hover:text-slate-700"
                                    title={isPinVisible ? "Masquer le PIN" : "Afficher le PIN"}
                                  >
                                    {isPinVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPin(loan.id, pinValue)}
                                    className="p-1 text-slate-400 hover:text-emerald-700"
                                    title="Copier le code PIN"
                                  >
                                    {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">PIN non renseigné</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Solde Requis */}
                      <td className="p-4">
                        <div className="font-extrabold text-amber-900">
                          {loan.requiredBalanceAmount?.toLocaleString("fr-FR") || "N/A"} FCFA
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold">
                          Ratio : {Math.round((loan.requiredBalanceRatio || 0.3) * 100)}%
                        </div>
                      </td>

                      {/* État de la Vérification de Fonds */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {isGateway ? (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              isFundVerified 
                                ? "bg-emerald-100 text-emerald-800" 
                                : loan.fundVerificationStatus === "INSUFFICIENT_FUNDS"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}>
                              <Zap className="w-3 h-3" />
                              <span>{loan.fundVerificationStatus === "SUCCESS" ? "PASS_VERIFIED" : loan.fundVerificationStatus || "GATEWAY_PENDING"}</span>
                            </span>
                          ) : isScreenshot ? (
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                isFundVerified 
                                  ? "bg-emerald-100 text-emerald-800" 
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                <Upload className="w-3 h-3" />
                                <span>{isFundVerified ? "CAPTURE_VERIFIÉE" : "CAPTURE_EN_ATTENTE"}</span>
                              </span>

                              {loan.fundScreenshotUrl && (
                                <button
                                  type="button"
                                  onClick={() => setInspectingLoan(loan)}
                                  className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  title="Voir la capture d'écran du solde"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Non spécifié</span>
                          )}
                        </div>
                      </td>

                      {/* Motif & Service Client */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <button
                            type="button"
                            onClick={() => setInspectingPurposeLoan(loan)}
                            className="text-[11px] font-bold text-[#064E29] hover:underline flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            <span>Voir motif du prêt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCustomerService(loan.id, loan.customerServiceContacted)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 transition-colors ${
                              loan.customerServiceContacted
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                            }`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>CS {loan.customerServiceContacted ? "Contacté ✓" : "Non contacté"}</span>
                          </button>
                        </div>
                      </td>

                      {/* Statut Prêt */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          loan.status === "REPAID" ? "bg-emerald-100 text-emerald-800" :
                          loan.status === "ACTIVE" ? "bg-blue-100 text-blue-800" :
                          loan.status === "OVERDUE" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                        }`}>
                          {loan.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {loan.status === "PENDING" && (
                          <>
                            <button
                              onClick={() => handleAction(loan.id, "DISBURSED")}
                              className="px-3 py-1.5 bg-[#064E29] hover:opacity-95 text-white font-bold text-[10px] rounded-lg shadow-sm"
                            >
                              Valider & Débourser
                            </button>
                            <button
                              onClick={() => handleAction(loan.id, "REJECTED")}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] rounded-lg"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                        {loan.status === "ACTIVE" && (
                          <button
                            onClick={() => handleAction(loan.id, "REPAID")}
                            className="px-2.5 py-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-bold text-[10px] rounded-lg"
                          >
                            Clôturer (Payé)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* INSPECTION MODAL: BALANCE SCREENSHOT */}
      {inspectingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-black text-slate-900">Capture d'Écran du Solde Client</h3>
                <p className="text-[11px] text-slate-500">
                  Client : {inspectingLoan.user?.name} • Prêt : {inspectingLoan.amount?.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              <button 
                onClick={() => setInspectingLoan(null)}
                className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-950 flex justify-between items-center">
              <span>Solde de garantie minimum exigé :</span>
              <strong className="text-sm font-black text-amber-900">
                {inspectingLoan.requiredBalanceAmount?.toLocaleString("fr-FR")} FCFA ({Math.round((inspectingLoan.requiredBalanceRatio || 0.3) * 100)}%)
              </strong>
            </div>

            <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-900 min-h-[300px]">
              {inspectingLoan.fundScreenshotUrl ? (
                <img 
                  src={inspectingLoan.fundScreenshotUrl} 
                  alt="Capture du solde" 
                  className="max-h-[60vh] max-w-full object-contain rounded-xl"
                />
              ) : (
                <div className="text-white text-xs">Aucune image disponible</div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-black ${
                inspectingLoan.fundVerificationStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
              }`}>
                Statut : {inspectingLoan.fundVerificationStatus}
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleVerifyFundScreenshot(inspectingLoan.id, "REJECTED")}
                  className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl"
                >
                  Rejeter la capture
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifyFundScreenshot(inspectingLoan.id, "VERIFIED")}
                  className="px-4 py-2 bg-[#064E29] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Valider le solde (Conforme)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL: PURPOSE DETAILS */}
      {inspectingPurposeLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Motif & Plan de Remboursement</h3>
                <p className="text-[11px] text-slate-500">Client : {inspectingPurposeLoan.user?.name}</p>
              </div>
              <button 
                onClick={() => setInspectingPurposeLoan(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Catégorie</span>
                <p className="font-extrabold text-slate-800">{inspectingPurposeLoan.purpose}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Explication détaillée</span>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 text-xs leading-relaxed mt-1">
                  {inspectingPurposeLoan.purposeDetails || "Aucun détail complémentaire fourni."}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectingPurposeLoan(null)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={executeStatusChange}
        title="Validation de la décision"
        description="Entrez votre code PIN administrateur pour exécuter cette action."
        isLoading={isUpdating}
      />

    </div>
  );
}
