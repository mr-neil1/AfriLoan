"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language } from "./translations";

type TranslationKey = keyof typeof translations.fr;

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, replacements?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("fr");

  useEffect(() => {
    const localLang = localStorage.getItem("afriloan_language") as Language;
    if (localLang && (localLang === "fr" || localLang === "en")) {
      setLanguageState(localLang);
    }
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("afriloan_language", lang);

    const token = localStorage.getItem("afriloan_token");
    if (token) {
      try {
        await fetch("/api/me", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ language: lang })
        });
      } catch (e) {
        console.error("Failed to sync language to backend", e);
      }
    }
  };

  const t = (key: TranslationKey, replacements?: Record<string, string | number>): string => {
    const dict = translations[language] || translations.fr;
    let text = dict[key] || translations.fr[key] || (key as string);

    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }

    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}
