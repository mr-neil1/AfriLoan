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
  ExternalLink
} from "lucide-react";

type NavItem = {
  label: string;
  href: string;
  icon: any;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Vue d'ensemble", href: "/admin", icon: LayoutDashboard },
  { label: "Validation KYC", href: "/admin/kyc", icon: ShieldCheck },
  { label: "Comptes Bancaires", href: "/admin/banks", icon: Building2 },
  { label: "Gestion des Prêts", href: "/admin/loans", icon: CreditCard },
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
      if (data.user?.role !== "ADMIN") {
        router.push("/app");
        return;
      }

      setAdminUser(data.user);
    } catch (e) {
      router.push("/auth");
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-[#04361C] text-white p-4 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="AfriLoan" className="h-8 w-auto brightness-0 invert" />
          <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Admin</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-[#04361C] text-white flex flex-col justify-between p-5 z-40 transition-transform duration-300 ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-6 border-b border-emerald-900/60">
            <img src="/logo.png" alt="AfriLoan" className="h-10 w-auto brightness-0 invert" />
            <div>
              <div className="text-xs font-black text-white">AfriLoan</div>
              <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Backoffice</div>
            </div>
          </div>

          <nav className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-800/80 text-amber-300 shadow-md border border-emerald-700/50"
                      : "text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-emerald-900/60 space-y-3">
          <Link
            href="/app"
            className="flex items-center justify-between px-4 py-2.5 bg-emerald-900/40 text-emerald-200 hover:text-white rounded-xl text-xs font-semibold"
          >
            <span>Retour Espace Client</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-rose-400 hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors"
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
    </div>
  );
}
