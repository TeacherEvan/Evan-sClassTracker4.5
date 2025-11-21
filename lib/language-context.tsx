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
  // Initialize with default language to match server-side rendering
  // We'll sync with client preference in useEffect to avoid hydration mismatch
  const [language, setLanguageState] = useState<Language>("th");

  // Sync language from user profile/localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Priority 1: Check user profile (if logged in)
      const user = loadUserSession();
      if (user?.preferredLanguage) {
        console.log(`🌍 Loaded language from user profile: ${user.preferredLanguage}`);
        setLanguageState(user.preferredLanguage as Language);
        localStorage.setItem("preferredLanguage", user.preferredLanguage);
        return;
      }

      // Priority 2: Check localStorage
      const saved = localStorage.getItem("preferredLanguage");
      if (saved) {
        setLanguageState(saved as Language);
        return;
      }

      // Priority 3: Auto-detect from browser if no preference
      const browserLang = navigator.language.toLowerCase();
      const detectedLang: Language = browserLang.startsWith('th') ? 'th' : 'en';

      console.log(`🌍 Auto-detected language: ${detectedLang} (from browser: ${navigator.language})`);
      setLanguageState(detectedLang);
      localStorage.setItem("preferredLanguage", detectedLang);
    }
  }, []);

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
