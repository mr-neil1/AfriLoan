"use client";

import { useEffect, useState } from "react";
import { 
  UserCog, 
  Plus, 
  Search, 
  Link2, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  Power, 
  Users, 
  CreditCard, 
  TrendingUp, 
  ExternalLink,
  X,
  Lock,
  Sparkles,
  Phone,
  MessageCircle,
  Headphones,
  Settings,
  Save,
  Edit3
} from "lucide-react";

interface AdminItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  adminCode: string;
  adminStatus: "ACTIVE" | "SUSPENDED";
  createdAt: string;
  clientCount: number;
  activeLoansCount: number;
  totalDisbursed: number;
  totalRepaid: number;
  supportPhone?: string | null;
  supportWhatsappLink?: string | null;
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Global Customer Service state (Super Admin)
  const [globalPhone, setGlobalPhone] = useState("+2250700000000");
  const [globalWhatsappUrl, setGlobalWhatsappUrl] = useState("https://wa.me/2250700000000");
  const [globalSaving, setGlobalSaving] = useState(false);
  const [globalSaved, setGlobalSaved] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Edit individual admin support state
  const [editingAdminSupport, setEditingAdminSupport] = useState<AdminItem | null>(null);
  const [editSupportPhone, setEditSupportPhone] = useState("");
  const [editSupportWhatsappLink, setEditSupportWhatsappLink] = useState("");
  const [editSupportSaving, setEditSupportSaving] = useState(false);
  const [editSupportError, setEditSupportError] = useState<string | null>(null);

  // Modal create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAdminCode, setNewAdminCode] = useState("");
  const [newSupportPhone, setNewSupportPhone] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const [adminsRes, supportRes] = await Promise.all([
        fetch("/api/admin/admins", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/support?mode=settings", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (adminsRes.ok) {
        const data = await adminsRes.json();
        setAdmins(data.admins || []);
      }

      if (supportRes.ok) {
        const supData = await supportRes.json();
        if (supData.global?.phone) setGlobalPhone(supData.global.phone);
        if (supData.global?.whatsappUrl) setGlobalWhatsappUrl(supData.global.whatsappUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = (adminCode: string, adminId: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/auth?agent=${adminCode}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedId(adminId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleToggleStatus = async (admin: AdminItem) => {
    const newStatus = admin.adminStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg = newStatus === "SUSPENDED"
      ? `Êtes-vous sûr de vouloir suspendre l'administrateur ${admin.name} ? Ses accès au backoffice seront immédiatement bloqués.`
      : `Réactiver l'administrateur ${admin.name} ?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          adminId: admin.id,
          adminStatus: newStatus
        })
      });

      if (res.ok) {
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur de mise à jour");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDeleteAdmin = async (admin: AdminItem) => {
    if (!confirm(`Supprimer définitivement l'administrateur ${admin.name} ? Ses clients rattachés seront réaffectés à la gestion globale.`)) {
      return;
    }

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch(`/api/admin/admins?id=${admin.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur de suppression");
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveGlobalSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalSaving(true);
    setGlobalSaved(false);
    setGlobalError(null);

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          isGlobal: true,
          supportPhone: globalPhone,
          supportWhatsappLink: globalWhatsappUrl
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");

      setGlobalSaved(true);
      setTimeout(() => setGlobalSaved(false), 3000);
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setGlobalSaving(false);
    }
  };

  const handleOpenEditSupport = (adm: AdminItem) => {
    setEditingAdminSupport(adm);
    setEditSupportPhone(adm.supportPhone || adm.phone || "");
    setEditSupportWhatsappLink(adm.supportWhatsappLink || "");
    setEditSupportError(null);
  };

  const handleSaveAdminSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminSupport) return;
    setEditSupportSaving(true);
    setEditSupportError(null);

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          targetAdminId: editingAdminSupport.id,
          supportPhone: editSupportPhone,
          supportWhatsappLink: editSupportWhatsappLink
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");

      setEditingAdminSupport(null);
      fetchAdmins();
    } catch (err: any) {
      setEditSupportError(err.message);
    } finally {
      setEditSupportSaving(false);
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateLoading(true);

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          phone: newPhone,
          adminCode: newAdminCode,
          supportPhone: newSupportPhone
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Échec de création de l'administrateur.");
      }

      setIsModalOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewPhone("");
      setNewAdminCode("");
      setNewSupportPhone("");
      fetchAdmins();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const filtered = admins.filter(a => {
    const q = search.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.adminCode.toLowerCase().includes(q) ||
      (a.phone && a.phone.includes(q))
    );
  });

  const totalClients = admins.reduce((acc, a) => acc + a.clientCount, 0);
  const totalVolume = admins.reduce((acc, a) => acc + a.totalDisbursed, 0);
  const totalRepaid = admins.reduce((acc, a) => acc + a.totalRepaid, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-900 rounded-full text-xs font-bold mb-1 border border-amber-200">
            <UserCog className="w-3.5 h-3.5 text-amber-700" />
            <span>Gestion Multi-Admin & Réseau d'Agents</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Administrateurs & Liens Personnalisés</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Attribuez un lien d'inscription unique à chaque administrateur pour lui permettre de gérer son propre portefeuille d'emprunteurs.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-md transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Administrateur</span>
        </button>
      </div>

      {/* Super Admin Global Customer Service Configuration */}
      <div className="bg-gradient-to-br from-slate-900 to-[#04361C] p-6 rounded-3xl border border-emerald-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-[11px] font-extrabold mb-2 border border-amber-400/30">
              <Headphones className="w-3.5 h-3.5 text-amber-400" />
              <span>Configuration Super Admin</span>
            </div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <span>Service Client Global de la Plateforme</span>
            </h2>
            <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
              Ce contact WhatsApp et téléphonique s'applique à tous les emprunteurs non rattachés à un agent spécifique ainsi qu'aux visiteurs publics de la plateforme.
            </p>
          </div>

          <form onSubmit={handleSaveGlobalSupport} className="flex-1 max-w-xl bg-slate-950/40 p-4 rounded-2xl border border-emerald-600/30 space-y-3">
            {globalError && (
              <div className="p-2.5 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{globalError}</span>
              </div>
            )}

            {globalSaved && (
              <div className="p-2.5 bg-emerald-950/60 border border-emerald-400/50 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Paramètres du service client global enregistrés avec succès !</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                  Numéro WhatsApp Principal
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
                  <input
                    type="tel"
                    required
                    value={globalPhone}
                    onChange={(e) => setGlobalPhone(e.target.value)}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-emerald-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-emerald-200 mb-1">
                  Lien WhatsApp Direct
                </label>
                <div className="relative">
                  <MessageCircle className="w-3.5 h-3.5 absolute left-3 top-3 text-emerald-400" />
                  <input
                    type="url"
                    value={globalWhatsappUrl}
                    onChange={(e) => setGlobalWhatsappUrl(e.target.value)}
                    placeholder="https://wa.me/2250700000000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900/80 border border-emerald-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-emerald-200/60">
                Géré exclusivement par le Super Admin
              </span>
              <button
                type="submit"
                disabled={globalSaving}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {globalSaving ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Sauvegarder</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Admins / Agents</span>
            <UserCog className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{admins.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Actifs sur la plateforme</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Clients Rattachés</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalClients}</div>
          <div className="text-[11px] text-slate-500 mt-1">Emprunteurs enregistrés</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Volume Prêts</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalVolume.toLocaleString("fr-FR")} F</div>
          <div className="text-[11px] text-slate-500 mt-1">Déboursé au total</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Remboursements</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{totalRepaid.toLocaleString("fr-FR")} F</div>
          <div className="text-[11px] text-slate-500 mt-1">Recouvré avec succès</div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, e-mail, code agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
          />
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center">
            <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Aucun administrateur trouvé.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-bold">
                  <th className="p-4">Administrateur</th>
                  <th className="p-4">Statut & Rôle</th>
                  <th className="p-4">Lien Personnalisé Agent</th>
                  <th className="p-4">Service Client Dédié</th>
                  <th className="p-4">Portefeuille Clients</th>
                  <th className="p-4">Prêts Déboursés</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((adm) => {
                  const isSuper = adm.role === "SUPER_ADMIN";
                  const isCopied = copiedId === adm.id;
                  const origin = typeof window !== "undefined" ? window.location.origin : "";
                  const fullLink = `${origin}/auth?agent=${adm.adminCode}`;

                  return (
                    <tr key={adm.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Contact */}
                      <td className="p-4">
                        <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>{adm.name}</span>
                          {isSuper && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black border border-amber-200">
                              PRINCIPAL
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{adm.email}</div>
                        {adm.phone && <div className="text-[10px] text-slate-500">{adm.phone}</div>}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          adm.adminStatus === "ACTIVE" 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          {adm.adminStatus === "ACTIVE" ? "Actif" : "Suspendu"}
                        </span>
                      </td>

                      {/* Custom Link */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 font-mono text-[11px] text-slate-800 font-bold">
                            <Link2 className="w-3.5 h-3.5 text-[#064E29]" />
                            <span>{adm.adminCode}</span>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(adm.adminCode, adm.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Lien copié !</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copier le lien complet</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Customer Service Dedicated */}
                      <td className="p-4">
                        <div className="space-y-1">
                          {adm.supportPhone ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-[#064E29] text-[11px] font-bold">
                              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>{adm.supportPhone}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 italic">
                              Hérite du Global
                            </div>
                          )}
                          <div>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSupport(adm)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#064E29] hover:underline transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Modifier</span>
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Clients Count */}
                      <td className="p-4">
                        <div className="font-black text-slate-900 text-sm">
                          {adm.clientCount} emprunteur{adm.clientCount > 1 ? "s" : ""}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {adm.activeLoansCount} prêt{adm.activeLoansCount > 1 ? "s" : ""} en cours
                        </div>
                      </td>

                      {/* Volume */}
                      <td className="p-4">
                        <div className="font-extrabold text-[#064E29]">
                          {adm.totalDisbursed.toLocaleString("fr-FR")} FCFA
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Recouvré : {adm.totalRepaid.toLocaleString("fr-FR")} FCFA
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        {!isSuper ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(adm)}
                              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                adm.adminStatus === "ACTIVE"
                                  ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                                  : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              }`}
                              title={adm.adminStatus === "ACTIVE" ? "Suspendre l'administrateur" : "Réactiver l'administrateur"}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(adm)}
                              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Supprimer définitivement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold italic">
                            Accès Principal Global
                          </span>
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

      {/* CREATE SUB-ADMIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92dvh]">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#04361C] to-[#0A5C36] text-white">
              <div>
                <h3 className="text-base font-black text-white">Ajouter un Administrateur</h3>
                <p className="text-[11px] text-emerald-200">
                  Générez un compte gestionnaire avec lien de portefeuille personnalisé.
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="p-6 overflow-y-auto space-y-4">
              
              {createError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{createError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom complet du gestionnaire *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kouamé Jean-Marc"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Adresse e-mail professionnelle *
                </label>
                <input
                  type="email"
                  required
                  placeholder="agent@afriloan.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone
                </label>
                <input
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Numéro WhatsApp Service Client dédié</span>
                  <span className="text-[10px] text-slate-400">Optionnel (utilisera le numéro global sinon)</span>
                </label>
                <input
                  type="tel"
                  placeholder="+225 07 00 00 00 00"
                  value={newSupportPhone}
                  onChange={(e) => setNewSupportPhone(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Code personnalisé (Slug Agent)</span>
                  <span className="text-[10px] text-slate-400">Optionnel (généré automatiquement sinon)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: AGENT-MARC ou AL-01"
                  value={newAdminCode}
                  onChange={(e) => setNewAdminCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:outline-none focus:border-[#064E29]"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Lien généré : <code className="bg-slate-100 px-1 py-0.5 rounded text-[#064E29] font-mono">https://afriloan.com/auth?agent={newAdminCode || "CODE-AGENT"}</code>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mot de passe d'accès au backoffice *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Au moins 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] hover:opacity-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {createLoading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    <>
                      <UserCog className="w-4 h-4" />
                      <span>Créer l'Administrateur</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* EDIT ADMIN SUPPORT MODAL */}
      {editingAdminSupport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#04361C] to-[#0A5C36] text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Headphones className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Service Client Dédié</h3>
                  <p className="text-[11px] text-emerald-200">
                    Portefeuille de {editingAdminSupport.name}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingAdminSupport(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdminSupport} className="p-6 space-y-4">
              {editSupportError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{editSupportError}</span>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Les clients affiliés à cet administrateur (via son lien <strong>{editingAdminSupport.adminCode}</strong>) contacteront automatiquement ce numéro WhatsApp lorsqu'ils solliciteront le support.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro de téléphone Service Client / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+225 07 00 00 00 00"
                    value={editSupportPhone}
                    onChange={(e) => setEditSupportPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Laissez vide pour rétablir le numéro de service client global par défaut.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Lien WhatsApp personnalisé (Optionnel)</span>
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="url"
                    placeholder="https://wa.me/2250700000000"
                    value={editSupportWhatsappLink}
                    onChange={(e) => setEditSupportWhatsappLink(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Généré automatiquement à partir du numéro de téléphone si non renseigné.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAdminSupport(null)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={editSupportSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
                >
                  {editSupportSaving ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
