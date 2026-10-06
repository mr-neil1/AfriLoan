"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Search, 
  ShieldCheck, 
  Edit3, 
  Check, 
  X, 
  RefreshCw, 
  MapPin, 
  Building2, 
  Award, 
  ExternalLink,
  Wallet,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  Smartphone,
  CreditCard
} from "lucide-react";
import AdminPinModal from "@/components/admin/AdminPinModal";
import { ALL_MOBILE_OPERATORS, getMobileMoneyLogo } from "@/lib/countriesData";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Full 360 Edit Modal State
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen360Edit = (u: any) => {
    setSelectedUser(u);
    setEditFormData({
      userId: u.id,
      name: u.name || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "USER",
      currency: u.currency || "XOF",
      countryCode: u.countryCode || "CI",
      city: u.city || "",
      address: u.address || "",
      latitude: u.latitude ?? "",
      longitude: u.longitude ?? "",
      profession: u.profession || "",
      monthlyIncome: u.monthlyIncome ?? "",
      emergencyContactName: u.emergencyContactName || "",
      emergencyContactPhone: u.emergencyContactPhone || "",
      emergencyContactRel: u.emergencyContactRel || "",
      kycStatus: u.kycStatus || "NOT_SUBMITTED",
      creditLimit: u.creditLimit || 10000,
      creditScore: u.creditScore || 50,
      availableCredit: u.availableCredit || 10000,
      walletBalance: u.walletBalance || 0,
      mobileMoneyProvider: u.mobileMoneyProvider || "ORANGE_MONEY",
      mobileMoneyNumber: u.mobileMoneyNumber || "",
      autoRecalculateScore: false
    });
  };

  const handleSaveClick = () => {
    setIsPinModalOpen(true);
  };

  const executeFullUserUpdate = async (pin: string) => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...editFormData,
          pin
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Erreur de mise à jour");
      }

      setIsPinModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.city?.toLowerCase().includes(q) ||
      u.countryCode?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-[#064E29] rounded-full text-xs font-bold mb-1 border border-emerald-200">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Gestion Intégrale des Comptes</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Emprunteurs & Fiches 360°</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision et modification de toutes les données : KYC, coordonnées GPS, banques, limites et scores.
          </p>
        </div>

        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone, ville..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="text-center py-24">
            <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 p-6">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Aucun emprunteur trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Utilisateur / Pays</th>
                  <th className="p-4">Localisation Domicile</th>
                  <th className="p-4">Score Solvabilité</th>
                  <th className="p-4">Plafond Crédit</th>
                  <th className="p-4">Statut KYC</th>
                  <th className="p-4">Banques & Cartes</th>
                  <th className="p-4">Rôle</th>
                  <th className="p-4 text-right">Actions 360°</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((u) => {
                  const hasGps = u.latitude && u.longitude;
                  const googleMapsUrl = hasGps ? `https://www.google.com/maps?q=${u.latitude},${u.longitude}` : null;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-4">
                        <div className="font-black text-slate-900 flex items-center gap-1.5">
                          <span>{u.countryCode === "CM" ? "🇨🇲" : u.countryCode === "CI" ? "🇨🇮" : u.countryCode === "GA" ? "🇬🇦" : "🇨🇩"}</span>
                          <span>{u.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{u.phone || u.email}</div>
                        {u.assignedAdmin && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
                            <span>Agent : {u.assignedAdmin.name}</span>
                          </div>
                        )}
                        {u.mobileMoneyProvider && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <img 
                              src={getMobileMoneyLogo(u.mobileMoneyProvider)} 
                              alt="" 
                              className="w-3.5 h-3.5 rounded object-contain bg-white p-0.5 border border-slate-200 shrink-0" 
                            />
                            <span className="text-[10px] text-[#064E29] font-bold truncate max-w-[120px]">{u.mobileMoneyProvider}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{u.city || "Non spécifié"}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[150px]">{u.address || "Adresse non saisie"}</div>
                        {googleMapsUrl && (
                          <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-[#064E29] font-bold hover:underline mt-0.5"
                          >
                            <MapPin className="w-3 h-3" />
                            <span>Voir sur Maps</span>
                          </a>
                        )}
                      </td>
                      <td className="p-4 font-black">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-[#064E29] text-[11px] border border-emerald-200">
                          {u.creditScore} / 1000
                        </span>
                      </td>
                      <td className="p-4 font-black text-[#064E29]">
                        {u.creditLimit.toLocaleString("fr-FR")} {u.currency}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                          u.kycStatus === "VERIFIED" ? "bg-emerald-100 text-emerald-800" :
                          u.kycStatus === "REJECTED" ? "bg-rose-100 text-rose-800" :
                          u.kycStatus === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                        }`}>
                          {u.kycStatus}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          {u.bankAccounts?.length > 0 ? (
                            <div className="font-bold text-emerald-800 text-xs flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[130px]">{u.bankAccounts[0].bankName}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px] block">Aucune banque</span>
                          )}
                          {u.bankCards?.length > 0 ? (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200/80 text-indigo-900 text-[10px] font-black">
                              <CreditCard className="w-2.5 h-2.5 text-indigo-600 shrink-0" />
                              <span>{u.bankCards.length} carte{u.bankCards.length > 1 ? "s" : ""}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          u.role === "ADMIN" ? "bg-amber-100 text-amber-900" : "bg-slate-100 text-slate-700"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpen360Edit(u)}
                          className="px-3 py-1.5 bg-[#064E29] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Fiche 360°</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Full 360 User Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#064E29] text-white flex items-center justify-center font-black text-lg shadow-md">
                  {selectedUser.name?.slice(0, 2).toUpperCase() || "AL"}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Fiche Emprunteur 360° : {selectedUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID Client : <span className="font-mono text-slate-700">{selectedUser.id}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Fields: Editable 360 */}
            <div className="space-y-5">
              
              {/* Personal Information */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#064E29] uppercase tracking-wider">
                  Informations Personnelles & Compte
                </h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom complet</label>
                    <input
                      type="text"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Téléphone</label>
                    <input
                      type="tel"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Rôle Système</label>
                    <select
                      value={editFormData.role}
                      onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                    >
                      <option value="USER">USER (Client Emprunteur)</option>
                      <option value="ADMIN">ADMIN (Administrateur)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Statut KYC Global</label>
                    <select
                      value={editFormData.kycStatus}
                      onChange={(e) => setEditFormData({ ...editFormData, kycStatus: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                    >
                      <option value="NOT_SUBMITTED">NOT_SUBMITTED</option>
                      <option value="PENDING">PENDING (En attente)</option>
                      <option value="VERIFIED">VERIFIED (Vérifié)</option>
                      <option value="REJECTED">REJECTED (Rejeté)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Devise Principale</label>
                    <select
                      value={editFormData.currency}
                      onChange={(e) => setEditFormData({ ...editFormData, currency: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                    >
                      <option value="XOF">XOF (Franc CFA BCEAO)</option>
                      <option value="XAF">XAF (Franc CFA BEAC)</option>
                      <option value="CDF">CDF (Franc congolais)</option>
                      <option value="USD">USD (Dollar US)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Money Operator Settings */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>Opérateur & Numéro Mobile Money</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {ALL_MOBILE_OPERATORS.map((op) => (
                    <button
                      key={op.id}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, mobileMoneyProvider: op.id })}
                      className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                        editFormData.mobileMoneyProvider === op.id
                          ? "border-[#064E29] bg-emerald-50 text-[#064E29] font-bold shadow-xs ring-1 ring-[#064E29]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-100 p-0.5 flex items-center justify-center overflow-hidden">
                        <img src={op.logoUrl} alt={op.name} className="w-full h-full object-contain" />
                      </div>
                      <span className="text-[10px] font-bold truncate w-full">{op.name}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Numéro Mobile Money (pour déboursement & prélèvements)
                  </label>
                  <input
                    type="tel"
                    value={editFormData.mobileMoneyNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileMoneyNumber: e.target.value })}
                    placeholder="+225 07 00 00 00 00"
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                  />
                </div>
              </div>

              {/* Financial & Scoring parameters */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <span>Paramètres Financiers & Solvabilité</span>
                  </h4>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-900">
                    <input
                      type="checkbox"
                      checked={editFormData.autoRecalculateScore}
                      onChange={(e) => setEditFormData({ ...editFormData, autoRecalculateScore: e.target.checked })}
                      className="checkbox checkbox-xs checkbox-accent"
                    />
                    <span>Recalculer le score dynamiquement</span>
                  </label>
                </div>

                <div className="grid sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Score Solvabilité (50-1000)</label>
                    <input
                      type="number"
                      value={editFormData.creditScore}
                      onChange={(e) => setEditFormData({ ...editFormData, creditScore: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#064E29] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Plafond Crédit</label>
                    <input
                      type="number"
                      value={editFormData.creditLimit}
                      onChange={(e) => setEditFormData({ ...editFormData, creditLimit: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Crédit Disponible</label>
                    <input
                      type="number"
                      value={editFormData.availableCredit}
                      onChange={(e) => setEditFormData({ ...editFormData, availableCredit: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Solde Portefeuille</label>
                    <input
                      type="number"
                      value={editFormData.walletBalance}
                      onChange={(e) => setEditFormData({ ...editFormData, walletBalance: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Domicile & Google Maps GPS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#064E29] uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-700" />
                  <span>Localisation & Coordonnées Google Maps</span>
                </h4>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Pays</label>
                    <select
                      value={editFormData.countryCode}
                      onChange={(e) => setEditFormData({ ...editFormData, countryCode: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value="CI">🇨🇮 Côte d'Ivoire</option>
                      <option value="CM">🇨🇲 Cameroun</option>
                      <option value="GA">🇬🇦 Gabon</option>
                      <option value="CD">🇨🇩 RDC</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Ville</label>
                    <input
                      type="text"
                      value={editFormData.city}
                      onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Adresse complète</label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Latitude GPS</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.latitude}
                      onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                      placeholder="Ex: 5.359952"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Longitude GPS</label>
                    <input
                      type="number"
                      step="any"
                      value={editFormData.longitude}
                      onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                      placeholder="Ex: -4.008256"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Profession & Emergency Contact */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-[#064E29] uppercase tracking-wider">
                  Situation Professionnelle & Contact d'Urgence
                </h4>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Profession</label>
                    <input
                      type="text"
                      value={editFormData.profession}
                      onChange={(e) => setEditFormData({ ...editFormData, profession: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Revenu Mensuel</label>
                    <input
                      type="number"
                      value={editFormData.monthlyIncome}
                      onChange={(e) => setEditFormData({ ...editFormData, monthlyIncome: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom contact d'urgence</label>
                    <input
                      type="text"
                      value={editFormData.emergencyContactName}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Lien de parenté</label>
                    <input
                      type="text"
                      value={editFormData.emergencyContactRel}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactRel: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Téléphone d'urgence</label>
                    <input
                      type="tel"
                      value={editFormData.emergencyContactPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, emergencyContactPhone: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Moyens Bancaires & Cartes Liées */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-700" />
                    <span>Moyens Bancaires Certifiés ({selectedUser.bankAccounts?.length || 0} comptes, {selectedUser.bankCards?.length || 0} cartes)</span>
                  </h4>
                  <a
                    href="/admin/kyc"
                    className="text-[11px] font-bold text-emerald-800 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Dossier KYC</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-1">
                  {/* Bank Accounts */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Comptes bancaires</p>
                    {selectedUser.bankAccounts?.length > 0 ? (
                      selectedUser.bankAccounts.map((b: any) => (
                        <div key={b.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-black text-slate-900">{b.bankName}</div>
                            <div className="font-mono text-[11px] text-slate-500">{b.accountNumber}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            b.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>{b.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Aucun compte bancaire enregistré</p>
                    )}
                  </div>

                  {/* Bank Cards */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cartes bancaires (Visa / Mastercard)</p>
                    {selectedUser.bankCards?.length > 0 ? (
                      selectedUser.bankCards.map((c: any) => (
                        <div key={c.id} className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <div className="font-black text-slate-900 flex items-center gap-1.5">
                              <span>{c.cardBrand || "CARTE"}</span>
                              <span className="font-mono text-[11px] text-slate-500">{c.cardNumber}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-semibold">{c.cardHolder} • Exp {c.expiryMonth}/{c.expiryYear}</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                            c.status === "VERIFIED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          }`}>{c.status}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Aucune carte bancaire enregistrée</p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                className="flex-1 py-3 bg-[#064E29] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Enregistrer la Fiche 360°</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Admin PIN Validation Modal */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={executeFullUserUpdate}
        title="Validation Administrateur 360°"
        description="Saisissez votre code PIN administrateur pour valider les modifications globales de ce compte client."
        isLoading={isSaving}
      />

    </div>
  );
}
