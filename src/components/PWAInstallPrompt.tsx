"use client";

import { useEffect, useState } from "react";
import { Download, X, Smartphone, Sparkles, Share2, PlusSquare, ArrowRight, ShieldCheck } from "lucide-react";

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
      return;
    }

    const isIosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(isIosDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("afriloan_pwa_dismissed");
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Show prompt after 3s on iOS if not dismissed
    if (isIosDevice) {
      const dismissed = localStorage.getItem("afriloan_pwa_dismissed");
      if (!dismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    // Listen for manual trigger events from elsewhere in the app (e.g. Profile or Help)
    const manualTriggerHandler = () => {
      if (isIosDevice) {
        setShowIosModal(true);
      } else if (deferredPrompt) {
        deferredPrompt.prompt();
      } else {
        setShowPrompt(true);
      }
    };
    window.addEventListener("trigger-afriloan-install", manualTriggerHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("trigger-afriloan-install", manualTriggerHandler);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction
      alert("Pour installer l'application sur votre appareil, ouvrez le menu de votre navigateur (les 3 points en haut à droite) et choisissez 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.");
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("afriloan_pwa_dismissed", "true");
  };

  if (isStandalone) return null;

  return (
    <>
      {/* Floating Install Prompt Banner (Visible on mobile & desktop if not dismissed) */}
      {showPrompt && (
        <div className="fixed bottom-28 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slideUp">
          <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-[#0A2617] to-slate-950 border border-emerald-500/40 p-3.5 sm:p-4 shadow-2xl backdrop-blur-xl relative flex items-center gap-3 text-white">
            
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Fermer la notification d'installation"
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-800 border border-emerald-500/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shadow-md"
            >
              <X size={13} />
            </button>

            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#064E29] to-emerald-600 border border-emerald-400/40 flex items-center justify-center text-white shrink-0 shadow-inner">
              <Smartphone size={22} className="text-amber-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                <Sparkles size={12} />
                <span>Installer AfriLoan</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                {isIOS ? "Ajouter à l'écran d'accueil iOS" : "Accès instantané & 100% sécurisé"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleInstallClick}
              className="shrink-0 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Download size={13} className="stroke-[2.5]" />
              <span>Installer</span>
            </button>
          </div>
        </div>
      )}

      {/* iOS Installation Guide Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#0F172A] border border-emerald-500/40 rounded-3xl p-6 text-white text-center shadow-2xl relative space-y-4 animate-scaleIn">
            
            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Installer sur iPhone / iPad</h3>
              <p className="text-xs text-slate-400">
                Ajoutez AfriLoan directement à votre écran d'accueil pour profiter d'une expérience native fluide.
              </p>
            </div>

            <div className="space-y-2.5 text-left text-xs bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                  1
                </span>
                <span className="text-slate-300 flex items-center gap-1.5 flex-wrap">
                  Appuyez sur le bouton <strong>Partager</strong>
                  <Share2 size={14} className="text-blue-400 inline" /> dans Safari.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                  2
                </span>
                <span className="text-slate-300 flex items-center gap-1.5 flex-wrap">
                  Faites défiler et choisissez <strong>Sur l'écran d'accueil</strong>
                  <PlusSquare size={14} className="text-emerald-400 inline" />.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs shrink-0">
                  3
                </span>
                <span className="text-slate-300">
                  Touchez <strong>Ajouter</strong> en haut à droite. C'est prêt !
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosModal(false)}
              className="w-full py-3 bg-[#064E29] hover:bg-[#0A5C36] text-white font-black text-xs rounded-xl shadow-lg transition-all"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
}
