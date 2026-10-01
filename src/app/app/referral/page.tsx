"use client";

import { useState, useEffect } from "react";
import { Users, Copy, Check, Gift, ArrowRight, Share2, Sparkles } from "lucide-react";

export default function ReferralPage() {
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const token = localStorage.getItem("afriloan_token");
      if (!token) return;

      const res = await fetch("/api/referrals", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const copyLink = () => {
    if (!data?.referralCode) return;
    const url = `${window.location.origin}/auth?tab=register&ref=${data.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="text-center py-20">
        <span className="loading loading-spinner loading-md text-[#064E29]"></span>
      </div>
    );
  }

  const referralUrl = data?.referralCode 
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth?tab=register&ref=${data.referralCode}`
    : "";

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-gradient-afriloan text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Programme Ambassadeur AfriLoan</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black">
            Parrainez vos proches, boostez votre crédit
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-lg leading-relaxed">
            Partagez votre lien exclusif. Pour chaque emprunteur qui s'inscrit et rembourse son prêt à temps, gagnez des bonus et augmentez votre propre plafond de crédit !
          </p>
        </div>
      </div>

      {/* Share Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
          Votre lien de parrainage exclusif
        </h3>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-700 truncate select-all">
            {referralUrl}
          </div>
          <button
            onClick={copyLink}
            className="px-6 py-3.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Lien copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copier le lien</span>
              </>
            )}
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Code de parrainage : <strong className="text-slate-800 font-mono font-black">{data?.referralCode}</strong>
        </div>
      </div>

      {/* Referrals List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900">
            Filleuls inscrits ({data?.referrals?.length || 0})
          </h3>
        </div>

        {!data?.referrals || data.referrals.length === 0 ? (
          <div className="text-center py-10">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">Aucun filleul enregistré pour le moment.</p>
            <p className="text-[11px] text-slate-400 mt-1">Partagez votre lien WhatsApp et sur vos réseaux.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {data.referrals.map((ref: any) => (
              <div key={ref.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <div className="font-extrabold text-slate-800">{ref.name}</div>
                  <div className="text-[10px] text-slate-400">Inscrit le {new Date(ref.createdAt).toLocaleDateString("fr-FR")}</div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  ref.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}>
                  {ref.isActive ? "Prêt Actif" : "Inscrit"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
