"use client";

import { useState, useEffect } from "react";
import { CreditCard, X, Check, Trash2, Eye, EyeOff, AlertCircle, ShieldAlert } from "lucide-react";

interface AdminCardEditModalProps {
  card: any | null;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export default function AdminCardEditModal({
  card,
  userName,
  isOpen,
  onClose,
  onUpdated
}: AdminCardEditModalProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("");
  const [expiryYear, setExpiryYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [cardBrand, setCardBrand] = useState("VISA");
  const [status, setStatus] = useState("VERIFIED");
  const [showFullCard, setShowFullCard] = useState(false);
  const [showCvc, setShowCvc] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (card) {
      setCardNumber(card.cardNumber || "");
      setCardHolder(card.cardHolder || "");
      setExpiryMonth(card.expiryMonth || "");
      setExpiryYear(card.expiryYear || "");
      setCvc(card.cvc || "");
      setCardBrand(card.cardBrand || "VISA");
      setStatus(card.status || "VERIFIED");
      setError(null);
    }
  }, [card]);

  if (!isOpen || !card) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/admin/cards", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: card.id,
          cardNumber,
          cardHolder,
          expiryMonth,
          expiryYear,
          cvc,
          cardBrand,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la modification de la carte.");

      onUpdated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer définitivement cette carte bancaire ?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch(`/api/admin/cards?id=${card.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors de la suppression.");

      onUpdated();
      onClose();
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900">
                Gestion Carte Bancaire (Admin)
              </h2>
              <p className="text-[11px] font-semibold text-slate-500">
                Client : <strong className="text-slate-800">{userName}</strong>
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Accès Administrateur :</strong> Vous avez accès aux informations complètes de la carte bancaire enregistrée par le client pour vérification de solvabilité et mise à jour en cas de demande.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-3.5">
            
            {/* Card Number */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Numéro de Carte
                </label>
                <button
                  type="button"
                  onClick={() => setShowFullCard(!showFullCard)}
                  className="text-[11px] text-emerald-800 font-bold hover:underline flex items-center gap-1"
                >
                  {showFullCard ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showFullCard ? "Masquer" : "Afficher en clair"}</span>
                </button>
              </div>
              <input
                type={showFullCard ? "text" : "password"}
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white"
                required
              />
            </div>

            {/* Card Holder */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Nom du Titulaire
              </label>
              <input
                type="text"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white uppercase"
                required
              />
            </div>

            {/* Expiry & CVC */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mois (MM)
                </label>
                <input
                  type="text"
                  maxLength={2}
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Année (AA)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    CVC
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCvc(!showCvc)}
                    className="text-[10px] text-slate-500 hover:text-slate-800"
                  >
                    {showCvc ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
                <input
                  type={showCvc ? "text" : "password"}
                  maxLength={4}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono font-bold text-center text-slate-900 focus:outline-none focus:border-[#064E29] focus:bg-white tracking-widest"
                  required
                />
              </div>
            </div>

            {/* Brand & Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Réseau de Carte
                </label>
                <select
                  value={cardBrand}
                  onChange={(e) => setCardBrand(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#064E29]"
                >
                  <option value="VISA">VISA</option>
                  <option value="MASTERCARD">MASTERCARD</option>
                  <option value="AMEX">AMERICAN EXPRESS</option>
                  <option value="OTHER">AUTRE</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Statut de la Carte
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#064E29]"
                >
                  <option value="VERIFIED">Vérifiée (Active)</option>
                  <option value="LINKED">Liée</option>
                  <option value="SUSPENDED">Suspendue</option>
                  <option value="EXPIRED">Expirée</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || isLoading}
                className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? "Suppression..." : "Supprimer cette carte"}</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 bg-[#064E29] hover:bg-[#0A5C36] text-white rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20 transition-all cursor-pointer min-h-[42px]"
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Enregistrer les modifications</span>
                  </>
                )}
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
}
