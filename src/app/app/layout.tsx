"use client";

import { Home, User as UserIcon, Wallet, CreditCard, Clock, Bell, LogOut, PlusCircle, ArrowUpRight, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageProvider } from "@/lib/LanguageContext";

function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLocked, setIsLocked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const isMobile = localStorage.getItem("afriloan_is_mobile_app") === "true";
    const sessionUnlocked = sessionStorage.getItem("afriloan_session_unlocked") === "true";
    
    if (isMobile && !sessionUnlocked) {
      setIsLocked(true);
      window.location.href = "/auth/pin?mode=login";
      return;
    }

    const checkUser = async () => {
      try {
        const token = localStorage.getItem("afriloan_token");
        if (!token) {
          window.location.href = "/auth";
          return;
        }

        const res = await fetch("/api/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.user?.role === "ADMIN") {
            setIsAdmin(true);
          }
        } else {
          localStorage.removeItem("afriloan_token");
          window.location.href = "/auth";
        }

        // Fetch notifications count
        const notifRes = await fetch("/api/notifications", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          const unread = notifData.notifications?.filter((n: any) => !n.isRead).length || 0;
          setUnreadCount(unread);
        }
      } catch (e) {
        // ignore
      }
    };
    checkUser();
  }, []);

  if (isLocked) {
    return (
      <div className="min-h-screen bg-[#064E29] flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-amber-400"></span>
      </div>
    );
  }

  const navItems = [
    { href: "/app", icon: Home, label: "Tableau de bord" },
    { href: "/app/kyc", icon: ShieldCheck, label: "Sécurité & KYC" },
    { href: "/app/loans", icon: CreditCard, label: "Mes Prêts" },
    { href: "/app/apply", icon: PlusCircle, label: "Nouveau prêt" },
    { href: "/app/repay", icon: ArrowUpRight, label: "Rembourser" },
    { href: "/app/profile", icon: UserIcon, label: "Mon Profil" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative pb-28 md:pb-0">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2">
            <img src="/logo.png" alt="AfriLoan" className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 text-xs font-bold px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? "text-[#064E29] bg-emerald-50"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header items */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 bg-slate-900 text-amber-400 border border-amber-500/40 px-3 py-1.5 rounded-full text-xs font-black shadow-sm hover:scale-105 transition-transform"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Admin</span>
              </Link>
            )}

            <Link
              href="/app#notifications"
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl relative transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => {
                localStorage.removeItem("afriloan_token");
                window.location.href = "/auth";
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors hidden sm:block"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2 px-4 flex justify-around items-center shadow-lg shadow-slate-400/20">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold py-1 px-2 rounded-xl transition-all ${
                isActive ? "text-[#064E29]" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <div className={`p-1.5 rounded-xl ${isActive ? "bg-emerald-50" : ""}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AppLayoutShell>{children}</AppLayoutShell>
    </LanguageProvider>
  );
}
