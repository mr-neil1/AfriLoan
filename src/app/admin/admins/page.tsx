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
  Sparkles
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
}

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState<AdminItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal create state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAdminCode, setNewAdminCode] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/admins", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
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
          adminCode: newAdminCode
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

    </div>
  );
}
