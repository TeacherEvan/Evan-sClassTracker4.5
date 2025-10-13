"use client";

import { useLanguage } from "@/lib/language-context";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg dark:border-gray-600">
      <Globe className="w-5 h-5" />
      <button
        onClick={() => setLanguage("en")}
        className={`px-3 py-1 rounded ${
          language === "en"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        } transition-colors`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("th")}
        className={`px-3 py-1 rounded ${
          language === "th"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        } transition-colors`}
      >
        ไทย
      </button>
    </div>
  );
}
