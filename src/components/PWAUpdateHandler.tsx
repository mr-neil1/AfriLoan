"use client";

import { useEffect, useState } from "react";
import { Sparkles, RefreshCw, X } from "lucide-react";

export default function PWAUpdateHandler() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    let refreshing = false;

    // Listen for new controller (when a new service worker activates via skipWaiting)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        // Small delay to ensure clean transition
        setTimeout(() => {
          window.location.reload();
        }, 600);
      }
    });

    const checkServiceWorkerUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Check for waiting worker
          if (registration.waiting) {
            setUpdateAvailable(true);
            setShowToast(true);
          }

          // Trigger server update check
          registration.update().catch(() => {});

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  setShowToast(true);
                }
              });
            }
          });
        }
      } catch (err) {
        // Silently catch registration read error
      }
    };

    // 1. Check immediately on mount
    checkServiceWorkerUpdate();

    // 2. Check whenever user returns to the app (PWA / APK resume)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkServiceWorkerUpdate();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    // 3. Periodic update check every 15 minutes
    const interval = setInterval(checkServiceWorkerUpdate, 15 * 60 * 1000);

    // 4. Custom manual trigger event
    const handleManualUpdate = async () => {
      setIsUpdating(true);
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
          await reg.update();
        }
        // Also clean up any expired localStorage cache
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("afriloan_cache_")) {
            localStorage.removeItem(key);
          }
        }
        setTimeout(() => {
          window.location.reload();
        }, 400);
      } catch {
        window.location.reload();
      }
    };
    window.addEventListener("trigger-afriloan-update", handleManualUpdate);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      window.removeEventListener("trigger-afriloan-update", handleManualUpdate);
      clearInterval(interval);
    };
  }, []);

  const handleApplyUpdate = async () => {
    setIsUpdating(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  if (!showToast || !updateAvailable) return null;

  return (
    <div className="fixed top-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-slideDown">
      <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-[#064E29] to-emerald-950 border border-emerald-400/50 p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl relative flex items-center gap-3 text-white">
        
        <button
          type="button"
          onClick={() => setShowToast(false)}
          aria-label="Fermer"
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shadow-md"
        >
          <X size={13} />
        </button>

        <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
          <Sparkles size={20} className="animate-spin-slow" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs font-black text-amber-300">
            Mise à jour disponible !
          </div>
          <p className="text-[11px] text-emerald-100 truncate mt-0.5">
            Une nouvelle version de l'application est prête.
          </p>
        </div>

        <button
          type="button"
          onClick={handleApplyUpdate}
          disabled={isUpdating}
          className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer min-h-[38px]"
        >
          <RefreshCw size={13} className={isUpdating ? "animate-spin" : ""} />
          <span>{isUpdating ? "Chargement..." : "Actualiser"}</span>
        </button>
      </div>
    </div>
  );
}
