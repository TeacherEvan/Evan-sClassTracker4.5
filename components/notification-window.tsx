"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationWindowProps {
  currentUserId: Id<"users">;
  currentUsername: string;
}

export function NotificationWindow({
  currentUserId,
  currentUsername,
}: NotificationWindowProps) {
  const { t, language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  const activeWindow = useQuery(api.notificationWindows.getActiveForUser, {
    userId: currentUserId,
  });
  const latestUpdate = useQuery(api.appUpdates.getActive, {});
  const markAsViewed = useMutation(api.notificationWindows.markAsViewed);

  useEffect(() => {
    if (activeWindow) {
      // Show with a slight delay for better UX
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [activeWindow]);

  const handleAcknowledge = async () => {
    if (!activeWindow) return;

    try {
      await markAsViewed({
        userId: currentUserId,
        windowId: activeWindow._id,
      });
      setIsVisible(false);
    } catch (error) {
      console.error("Failed to mark notification window as viewed:", error);
    }
  };

  // Don't render if no active window
  if (!activeWindow) {
    return null;
  }

  // Replace {username} placeholder with actual username
  const greeting =
    language === "en"
      ? activeWindow.greeting.replace("{username}", currentUsername)
      : activeWindow.greetingTh.replace("{username}", currentUsername);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Notification Window */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
          isVisible
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
          {/* Header with Gradient */}
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-8 rounded-t-2xl text-white">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                <Sparkles className="w-8 h-8" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">
              {language === "en" ? activeWindow.title : activeWindow.titleTh}
            </h2>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Personalized Greeting */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border-2 border-blue-200 dark:border-blue-800">
              <p className="text-lg font-semibold text-gray-800 dark:text-white">
                {greeting}
              </p>
            </div>

            {/* Main Message */}
            <div className="prose dark:prose-invert max-w-none">
              <div className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">
                {language === "en"
                  ? activeWindow.message
                  : activeWindow.messageTh}
              </div>
            </div>

            {/* App Updates Summary (if enabled) */}
            {activeWindow.showUpdateSummary && latestUpdate && (
              <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-6 mt-6">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  {t("Recent Updates", "อัปเดตล่าสุด")}
                </h3>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                      {latestUpdate.version}
                    </span>
                    <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(latestUpdate.releaseDate).toLocaleDateString(
                        language === "en" ? "en-US" : "th-TH",
                        { year: "numeric", month: "long", day: "numeric" },
                      )}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-800 dark:text-white mb-2">
                    {language === "en"
                      ? latestUpdate.title
                      : latestUpdate.titleTh}
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                    {language === "en"
                      ? latestUpdate.description
                      : latestUpdate.descriptionTh}
                  </p>
                  {latestUpdate.features.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                        {t("Key Features", "ฟีเจอร์สำคัญ")}
                      </p>
                      <ul className="space-y-2">
                        {latestUpdate.features
                          .slice(0, 3)
                          .map((feature, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700 dark:text-gray-300">
                                {language === "en"
                                  ? feature.title
                                  : feature.titleTh}
                              </span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer with Acknowledge Button */}
          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-b-2xl border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleAcknowledge}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold text-lg rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <CheckCircle className="w-6 h-6" />
              {t("OK, I understand", "ตกลง เข้าใจแล้ว")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
