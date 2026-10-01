"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function MobileRedirect() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone;
    const urlParams = new URLSearchParams(window.location.search);
    const isPwaSource = urlParams.get("source") === "pwa";
    const hasMobileStorage = localStorage.getItem("afriloan_is_mobile_app") === "true";

    if (isStandalone || isPwaSource || hasMobileStorage) {
      localStorage.setItem("afriloan_is_mobile_app", "true");
      
      const savedEmail = localStorage.getItem("afriloan_mobile_email");
      if (savedEmail) {
        router.replace("/auth/pin");
      } else {
        router.replace("/auth");
      }
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
        <div className="w-28 h-28 mb-6">
          <img src="/logo.png" alt="AfriLoan" className="w-full h-full object-contain animate-pulse" />
        </div>
        <span className="loading loading-spinner loading-lg text-[#064E29]"></span>
      </div>
    );
  }

  return null;
}
