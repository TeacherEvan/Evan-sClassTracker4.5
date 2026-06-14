"use client";

import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/lib/language-context";
import { loadUserSession } from "@/lib/session-utils";
import { useMutation } from "convex/react";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  const updateLanguagePreference = useMutation(
    api.users.updateLanguagePreference,
  );

  const handleLanguageChange = async (newLanguage: "en" | "th") => {
    // Update UI immediately
    setLanguage(newLanguage);

    // Sync to database if user is logged in
    const user = loadUserSession();
    if (user?._id) {
      try {
        await updateLanguagePreference({
          userId: user._id,
          preferredLanguage: newLanguage,
        });
        console.log(
          `✅ Language preference synced to database: ${newLanguage}`,
        );
      } catch (error) {
        console.error("Failed to sync language preference:", error);
        // Don't show error to user - UI still works via localStorage
      }
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border border-gray-300 rounded-lg dark:border-gray-600">
      <Globe className="w-5 h-5" />
      <button
        onClick={() => handleLanguageChange("en")}
        className={`px-3 py-1 rounded ${
          language === "en"
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
        } transition-colors`}
      >
        EN
      </button>
      <button
        onClick={() => handleLanguageChange("th")}
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
