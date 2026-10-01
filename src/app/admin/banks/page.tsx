"use client";

import { useEffect, useState } from "react";
import { 
  Building2, 
  Search, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Lock,
  X,
  CreditCard,
  ExternalLink
} from "lucide-react";
import AdminPinModal from "@/components/admin/AdminPinModal";

export default function AdminBanksPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Password visibility map { [accountId]: boolean }
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Edit bank credentials state
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [editBankName, setEditBankName] = useState("");
  const [editAccountNumber, setEditAccountNumber] = useState("");
  const [editAccountHolder, setEditAccountHolder] = useState("");
  const [editOnlineBankingId, setEditOnlineBankingId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editStatus, setEditStatus] = useState("LINKED");
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch("/api/admin/banks", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAccounts(json.accounts || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (accId: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [accId]: !prev[accId]
    }));
  };

  const handleCopyPassword = (accId: string, pwd: string) => {
    navigator.clipboard.writeText(pwd);
    setCopiedId(accId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEditClick = (acc: any) => {
    setEditingAccount(acc);
    setEditBankName(acc.bankName || "");
    setEditAccountNumber(acc.accountNumber || "");
    setEditAccountHolder(acc.accountHolder || "");
    setEditOnlineBankingId(acc.onlineBankingId || "");
    setEditPassword(acc.bankPassword || "");
    setEditStatus(acc.status || "LINKED");
  };

  const handleSaveClick = () => {
    setIsPinModalOpen(true);
  };

  const executeBankUpdate = async (pin: string) => {
    if (!editingAccount) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/banks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: editingAccount.id,
          bankName: editBankName,
          accountNumber: editAccountNumber,
          accountHolder: editAccountHolder,
          onlineBankingId: editOnlineBankingId,
          bankPassword: editPassword,
          status: editStatus,
          pin
        })
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Erreur de mise à jour");

      setIsPinModalOpen(false);
      setEditingAccount(null);
      fetchBanks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async (accId: string) => {
    if (!confirm("Voulez-vous supprimer définitivement cette liaison bancaire ?")) return;
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch(`/api/admin/banks?id=${accId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBanks();
      }
    } catch (e) {
      // ignore
    }
  };

  const filtered = accounts.filter((acc) => {
    const q = search.toLowerCase();
    return (
      acc.bankName?.toLowerCase().includes(q) ||
      acc.accountNumber?.toLowerCase().includes(q) ||
      acc.user?.name?.toLowerCase().includes(q) ||
      acc.user?.email?.toLowerCase().includes(q) ||
      acc.user?.phone?.toLowerCase().includes(q) ||
      acc.country?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064E29] rounded-full text-xs font-bold mb-1 border border-emerald-200">
            <Building2 className="w-3.5 h-3.5" />
            <span>Gestion Bancaire & Identifiants</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Comptes Bancaires Liés</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Consultation directe des identifiants et mots de passe bancaires, et modification des coordonnées.
          </p>
        </div>

        <button
          onClick={fetchBanks}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl self-start sm:self-auto transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par client, banque, compte..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-24">
            <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 p-6 space-y-2">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Aucun compte bancaire lié trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Client</th>
                  <th className="p-4">Pays / Banque</th>
                  <th className="p-4">N° de Compte</th>
                  <th className="p-4">Titulaire</th>
                  <th className="p-4">Mot de Passe / Code d'accès</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((acc) => {
                  const isVisible = visiblePasswords[acc.id];
                  const isCopied = copiedId === acc.id;
                  return (
                    <tr key={acc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900">{acc.user?.name}</div>
                        <div className="text-[10px] text-slate-400">{acc.user?.phone || acc.user?.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200/80 shadow-xs flex items-center justify-center overflow-hidden shrink-0 p-0.5">
                            {acc.bankLogo ? (
                              <img src={acc.bankLogo} alt={acc.bankName} className="w-full h-full object-contain" />
                            ) : (
                              <Building2 className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="text-xs">{acc.country === "CI" ? "🇨🇮" : acc.country === "CM" ? "🇨🇲" : acc.country === "GA" ? "🇬🇦" : "🇨🇩"}</span>
                              <span className="truncate">{acc.bankName}</span>
                            </div>
                            <div className="text-[10px] text-slate-400">{acc.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono font-bold text-[#064E29]">{acc.accountNumber}</div>
                        {acc.onlineBankingId && (
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            ID: <span className="font-mono font-bold text-slate-700">{acc.onlineBankingId}</span>
                            {acc.onlineBankingName && <span className="text-slate-400"> ({acc.onlineBankingName})</span>}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-medium text-slate-800">
                        {acc.accountHolder || "Non spécifié"}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                            {isVisible ? acc.bankPassword : "••••••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility(acc.id)}
                            className="p-1 text-slate-500 hover:text-slate-800"
                            title={isVisible ? "Masquer" : "Afficher en clair"}
                          >
                            {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyPassword(acc.id, acc.bankPassword)}
                            className="p-1 text-slate-500 hover:text-[#064E29]"
                            title="Copier le mot de passe"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          acc.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" :
                          acc.status === "SUSPENDED" ? "bg-rose-100 text-rose-800" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        }`}>
                          {acc.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleEditClick(acc)}
                            className="p-1.5 text-slate-500 hover:text-[#064E29] hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Modifier les coordonnées bancaires"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Supprimer la liaison"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Bank Modal */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-[#064E29] flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Modifier le Compte Bancaire</h3>
                  <p className="text-xs text-slate-500">Client : {editingAccount.user?.name}</p>
                </div>
              </div>
              <button onClick={() => setEditingAccount(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom de l'établissement</label>
                <input
                  type="text"
                  value={editBankName}
                  onChange={(e) => setEditBankName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Numéro de compte</label>
                  <input
                    type="text"
                    value={editAccountNumber}
                    onChange={(e) => setEditAccountNumber(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titulaire</label>
                  <input
                    type="text"
                    value={editAccountHolder}
                    onChange={(e) => setEditAccountHolder(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Identifiant Banque en Ligne (E-Banking ID)
                </label>
                <input
                  type="text"
                  value={editOnlineBankingId}
                  onChange={(e) => setEditOnlineBankingId(e.target.value)}
                  placeholder="Ex: Identifiant client e-banknet / SG Connect..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de passe / Code d'accès client (en clair)
                </label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statut</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                >
                  <option value="LINKED">LINKED (Lié)</option>
                  <option value="VERIFIED">VERIFIED (Vérifié)</option>
                  <option value="SUSPENDED">SUSPENDED (Suspendu)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingAccount(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                className="flex-1 py-3 bg-[#064E29] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Sauvegarder les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin PIN confirmation modal */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={executeBankUpdate}
        title="Confirmation Modification Bancaire"
        description="Saisissez votre code PIN administrateur pour enregistrer ces identifiants bancaires."
        isLoading={isSaving}
      />

    </div>
  );
}
