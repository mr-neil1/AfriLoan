"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Menu,
  X,
  LogOut,
  ExternalLink,
  UserCog,
  Link2,
  Copy,
  Check,
  Sparkles,
  Phone,
  MessageCircle,
  Headphones,
  Edit3,
  AlertTriangle,
  Save
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: any;
  superAdminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
  { label: "Admins & Liens Agents", href: "/admin/admins", icon: UserCog, superAdminOnly: true },
  { label: "Gestion des Prêts", href: "/admin/loans", icon: CreditCard },
  { label: "Validation KYC", href: "/admin/kyc", icon: ShieldCheck },
  { label: "Comptes Bancaires", href: "/admin/banks", icon: Building2 },
  { label: "Emprunteurs 360°", href: "/admin/users", icon: Users },
  { label: "Remboursements Reçus", href: "/admin/deposits", icon: ArrowDownLeft },
  { label: "Déboursements", href: "/admin/withdrawals", icon: ArrowUpRight }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Dedicated Support Phone modal state for Sub-Admins
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportPhoneInput, setSupportPhoneInput] = useState("");
  const [supportSaving, setSupportSaving] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportSuccess, setSupportSuccess] = useState(false);

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    try {
      const token = localStorage.getItem("afriloan_token");
      if (!token) {
        router.push("/auth?redirect=/admin");
        return;
      }

      const res = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        router.push("/auth");
        return;
      }

      const data = await res.json();
      const user = data.user;
      if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
        router.push("/app");
        return;
      }

      setAdminUser(user);
    } catch (e) {
      router.push("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const isSuperAdmin = 
    adminUser?.role === "SUPER_ADMIN" || 
    adminUser?.email?.toLowerCase() === "samyneil4@gmail.com";

  const agentCode = adminUser?.adminCode || adminUser?.id?.slice(-6).toUpperCase();
  const agentLink = typeof window !== "undefined" 
    ? `${window.location.origin}/auth?agent=${agentCode}` 
    : `/auth?agent=${agentCode}`;

  const copyAgentLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(agentLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleOpenSupportModal = () => {
    setSupportPhoneInput(adminUser?.supportPhone || "");
    setSupportError(null);
    setSupportSuccess(false);
    setIsSupportModalOpen(true);
  };

  const handleSaveSupportPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupportSaving(true);
    setSupportError(null);
    setSupportSuccess(false);

    try {
      const token = localStorage.getItem("afriloan_token");
      const res = await fetch("/api/support", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          supportPhone: supportPhoneInput
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de mise à jour");

      setAdminUser((prev: any) => ({
        ...prev,
        supportPhone: data.admin?.supportPhone || (supportPhoneInput.trim() || null),
        supportWhatsappLink: data.admin?.supportWhatsappLink
      }));

      setSupportSuccess(true);
      setTimeout(() => {
        setIsSupportModalOpen(false);
        setSupportSuccess(false);
      }, 1500);
    } catch (err: any) {
      setSupportError(err.message);
    } finally {
      setSupportSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("afriloan_token");
    router.push("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3">
        <span className="loading loading-spinner loading-lg text-emerald-400"></span>
        <p className="text-xs font-semibold text-slate-400">Connexion à la passerelle administrateur AfriLoan...</p>
      </div>
    );
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (item.superAdminOnly && !isSuperAdmin) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-[#04361C] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="AfriLoan" className="h-8 w-auto brightness-0 invert" />
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
            {isSuperAdmin ? "Super Admin" : "Gestionnaire"}
          </span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#04361C] text-white flex flex-col justify-between p-5 z-40 transition-transform duration-300 overflow-y-auto ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-5 border-b border-emerald-900/60">
            <img src="/logo.png" alt="AfriLoan" className="h-10 w-auto brightness-0 invert shrink-0" />
            <div className="min-w-0">
              <div className="text-xs font-black text-white truncate">{adminUser?.name || "AfriLoan"}</div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{isSuperAdmin ? "Super Admin" : "Gestionnaire"}</span>
              </div>
            </div>
          </div>

          {/* Sub-Admin Exclusive Referral Link Box */}
          <div className="p-3 bg-emerald-950/70 border border-emerald-700/50 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
              <span className="flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5" />
                <span>{isSuperAdmin ? "Lien Principal" : "Mon Lien Agent"}</span>
              </span>
              <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-mono text-[10px]">
                {agentCode}
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/80 leading-tight">
              Les emprunteurs inscrits via ce lien sont automatiquement rattachés à votre dashboard.
            </p>
            <button
              type="button"
              onClick={copyAgentLink}
              className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-sm"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-950" />
                  <span>Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier mon lien client</span>
                </>
              )}
            </button>
          </div>

          {/* Sub-Admin Dedicated Customer Service Configuration Box */}
          <div className="p-3 bg-emerald-950/70 border border-emerald-700/50 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-amber-300">
              <span className="flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mon Service Client</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[9px] font-bold ${
                adminUser?.supportPhone ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-800 text-slate-400"
              }`}>
                {adminUser?.supportPhone ? "DÉDIÉ" : "GLOBAL"}
              </span>
            </div>
            <div className="text-[11px] text-emerald-100 font-semibold truncate">
              {adminUser?.supportPhone ? (
                <div className="flex items-center gap-1.5 text-emerald-300 font-mono">
                  <Phone className="w-3 h-3 text-[#25D366]" />
                  <span>{adminUser.supportPhone}</span>
                </div>
              ) : (
                <span className="text-slate-400 text-[10px] italic">
                  Numéro plateforme par défaut
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleOpenSupportModal}
              className="w-full py-1.5 px-3 bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 text-emerald-200 hover:text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{adminUser?.supportPhone ? "Modifier mon numéro" : "Configurer mon numéro"}</span>
            </button>
          </div>

          <nav className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-800/80 text-amber-300 shadow-md border border-emerald-700/50"
                      : "text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-emerald-900/60 space-y-2 mt-4 shrink-0">
          <Link
            href="/app"
            className="flex items-center justify-between px-4 py-2 bg-emerald-900/40 text-emerald-200 hover:text-white rounded-xl text-xs font-semibold"
          >
            <span>Espace Client</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 text-rose-400 hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>

      {/* Dedicated Support Phone Modal */}
      {isSupportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
            
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#04361C] to-[#0A5C36] text-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Headphones className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Mon Service Client WhatsApp</h3>
                  <p className="text-[11px] text-emerald-200">
                    Configuration de votre contact direct
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSupportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupportPhone} className="p-6 space-y-4">
              {supportError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{supportError}</span>
                </div>
              )}

              {supportSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Numéro de service client enregistré avec succès !</span>
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Les emprunteurs inscrits via votre lien agent ou affectés à votre portefeuille seront redirigés directement vers votre compte WhatsApp pour toute demande d'assistance.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Votre Numéro de Téléphone WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="+225 07 12 34 56 78"
                    value={supportPhoneInput}
                    onChange={(e) => setSupportPhoneInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#064E29]"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Exemple : +2250701020304. Votre lien WhatsApp sera automatiquement généré.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupportModalOpen(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={supportSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#064E29] to-[#0A5C36] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 flex items-center gap-1.5 cursor-pointer"
                >
                  {supportSaving ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Enregistrer mon numéro</span>
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
