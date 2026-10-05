"use client";

import { useEffect, useState } from "react";
import { getCachedData, setCachedData } from "@/lib/storageCache";

export interface SupportContact {
  phone: string;
  whatsappUrl: string;
  agentName: string;
  isDedicatedAgent: boolean;
  formattedPhone?: string;
}

const DEFAULT_SUPPORT: SupportContact = {
  phone: "+2250700000000",
  whatsappUrl: "https://wa.me/2250700000000",
  agentName: "Service Client AfriLoan",
  isDedicatedAgent: false,
  formattedPhone: "+225 07 00 00 00 00"
};

const CACHE_KEY = "afriloan_support_contact";

export function useCustomerSupport() {
  const [support, setSupport] = useState<SupportContact>(DEFAULT_SUPPORT);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Initial instant load from cache
    const cached = getCachedData<SupportContact>(CACHE_KEY);
    if (cached) {
      setSupport(cached);
    }

    // 2. Fetch fresh support contact from API
    const fetchSupport = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("afriloan_token") : null;
        const agentRef = typeof window !== "undefined" ? localStorage.getItem("afriloan_agent_ref") : null;

        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url = agentRef ? `/api/support?agent=${encodeURIComponent(agentRef)}` : "/api/support";

        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          setSupport(data);
          setCachedData(CACHE_KEY, data);
        }
      } catch (e) {
        // Fallback already in place
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupport();
  }, []);

  return { support, isLoading };
}

export function buildWhatsAppMessageLink(baseUrl: string, message: string): string {
  if (!baseUrl) return "https://wa.me/2250700000000";
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
}
