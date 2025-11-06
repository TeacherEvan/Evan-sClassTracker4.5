"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { loadUserSession } from "./session-utils";

type Language = "en" | "th";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (en: string, th: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Initialize with smart detection: user profile > localStorage > browser language > default Thai
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      // Priority 1: Check user profile (if logged in)
      const user = loadUserSession();
      if (user?.preferredLanguage) {
        console.log(`🌍 Loaded language from user profile: ${user.preferredLanguage}`);
        localStorage.setItem("preferredLanguage", user.preferredLanguage);
        return user.preferredLanguage as Language;
      }

      // Priority 2: Check localStorage
      const saved = localStorage.getItem("preferredLanguage");

      // Priority 3: Auto-detect from browser if no preference
      if (!saved) {
        // Detect browser language (navigator.language returns 'en-US', 'th-TH', etc.)
        const browserLang = navigator.language.toLowerCase();
        const detectedLang: Language = browserLang.startsWith('th') ? 'th' : 'en';

        console.log(`🌍 Auto-detected language: ${detectedLang} (from browser: ${navigator.language})`);
        localStorage.setItem("preferredLanguage", detectedLang);
        return detectedLang;
      }
      return (saved as Language) || "th";
    }
    return "th";
  });

  // Sync language from user profile when user logs in
  useEffect(() => {
    const user = loadUserSession();
    if (user?.preferredLanguage && user.preferredLanguage !== language) {
      console.log(`🔄 Syncing language from user profile: ${user.preferredLanguage}`);
      setLanguageState(user.preferredLanguage as Language);
      localStorage.setItem("preferredLanguage", user.preferredLanguage);
    }
  }, [language]);

  // Persist language changes to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("preferredLanguage", lang);
    }
  };

  const t = (en: string, th: string) => {
    return language === "en" ? en : th;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
