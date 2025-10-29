"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import {
    Calendar,
    CheckCircle2,
    Gift,
    Sparkles,
    Star,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationWindowProps {
    userId: Id<"users">;
    username: string;
}

export function DesktopNotificationWindow({
    userId,
    username,
}: NotificationWindowProps) {
    const { t, language } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Queries
    const activeWindow = useQuery(api.notificationWindows.getActiveForUser, {
        userId,
    });
    const upcomingClasses = useQuery(api.classes.getUpcomingForNotification, {
        userId,
    });
    const latestUpdates = useQuery(api.appUpdates.getLatestForWindow, {});

    // Mutation
    const markAsViewed = useMutation(api.notificationWindows.markAsViewed);

    // Show window when data is ready
    useEffect(() => {
        if (activeWindow && !isVisible) {
            setIsVisible(true);
        }
    }, [activeWindow, isVisible]); const handleAcknowledge = async () => {
        if (!activeWindow) return;

        setIsClosing(true);
        setTimeout(async () => {
            await markAsViewed({
                userId,
                windowId: activeWindow._id,
            });
            setIsVisible(false);
            setIsClosing(false);
        }, 500);
    };

    if (!isVisible || !activeWindow) return null;

    const greeting =
        language === "th" ? activeWindow.greetingTh : activeWindow.greeting;
    const personalizedGreeting = greeting.replace("{username}", username);
    const message = language === "th" ? activeWindow.messageTh : activeWindow.message;
    const title = language === "th" ? activeWindow.titleTh : activeWindow.title;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            {/* Gold Tablet Container */}
            <div
                className={`relative max-w-2xl w-full max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl transform transition-all duration-500 ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
                    }`}
                style={{
                    background:
                        "linear-gradient(135deg, #f6e05e 0%, #d69e2e 25%, #f6ad55 50%, #ed8936 75%, #dd6b20 100%)",
                    boxShadow:
                        "0 0 60px rgba(251, 191, 36, 0.6), 0 0 100px rgba(251, 191, 36, 0.4), inset 0 0 80px rgba(255, 255, 255, 0.2)",
                }}
            >
                {/* Shining overlay effect */}
                <div
                    className="absolute inset-0 opacity-30 animate-shine"
                    style={{
                        background:
                            "linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.8) 50%, transparent 70%)",
                        backgroundSize: "200% 200%",
                    }}
                />

                {/* Sparkle decorations */}
                <div className="absolute top-4 left-4 animate-pulse">
                    <Sparkles className="w-6 h-6 text-yellow-100" />
                </div>
                <div className="absolute top-4 right-4 animate-pulse delay-150">
                    <Star className="w-6 h-6 text-yellow-100" />
                </div>
                <div className="absolute bottom-4 left-8 animate-pulse delay-300">
                    <Star className="w-5 h-5 text-yellow-100" />
                </div>
                <div className="absolute bottom-4 right-8 animate-pulse delay-500">
                    <Sparkles className="w-5 h-5 text-yellow-100" />
                </div>

                {/* Content Container */}
                <div className="relative bg-gradient-to-br from-amber-50/95 to-orange-50/95 dark:from-amber-950/95 dark:to-orange-950/95 m-3 rounded-2xl shadow-inner overflow-y-auto max-h-[85vh]">
                    {/* Header with close button */}
                    <div className="sticky top-0 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 px-6 py-4 border-b-2 border-amber-300 dark:border-amber-700 flex justify-between items-center z-10">
                        <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                            <Gift className="w-7 h-7" />
                            {title}
                        </h2>
                        <button
                            onClick={handleAcknowledge}
                            className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 transition-colors p-1"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Main Content */}
                    <div className="p-6 space-y-6">
                        {/* Personalized Greeting */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-amber-200 dark:border-amber-800">
                            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 mb-2">
                                {personalizedGreeting}
                            </p>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {message}
                                </p>
                            </div>
                        </div>

                        {/* Upcoming Classes Section */}
                        {upcomingClasses && upcomingClasses.length > 0 && (
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-xl p-6 shadow-lg border-2 border-blue-200 dark:border-blue-800">
                                <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 flex items-center gap-2 mb-4">
                                    <Calendar className="w-6 h-6" />
                                    {t("Your Upcoming Classes", "ชั้นเรียนที่กำลังจะมาถึง")}
                                </h3>
                                <div className="space-y-3">
                                    {upcomingClasses.slice(0, 3).map((cls) => (
                                        <div
                                            key={cls._id}
                                            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-700"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {cls.studentName}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {cls.locationName}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                        {new Date(cls.scheduledDate).toLocaleDateString(
                                                            language === "th" ? "th-TH" : "en-US",
                                                            { month: "short", day: "numeric" }
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {new Date(cls.scheduledDate).toLocaleTimeString(
                                                            language === "th" ? "th-TH" : "en-US",
                                                            { hour: "2-digit", minute: "2-digit" }
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {upcomingClasses.length > 3 && (
                                    <p className="text-sm text-center text-blue-600 dark:text-blue-400 mt-3">
                                        {t(
                                            `+${upcomingClasses.length - 3} more classes`,
                                            `อีก ${upcomingClasses.length - 3} ชั้นเรียน`
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Latest Updates Section */}
                        {activeWindow.showUpdateSummary && latestUpdates && latestUpdates.length > 0 && (
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-xl p-6 shadow-lg border-2 border-purple-200 dark:border-purple-800">
                                <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-4">
                                    <Sparkles className="w-6 h-6" />
                                    {t("What's New", "มีอะไรใหม่บ้าง")}
                                </h3>
                                <div className="space-y-4">
                                    {latestUpdates.map((update) => {
                                        const updateTitle = language === "th" ? update.titleTh : update.title;
                                        const updateDesc = language === "th" ? update.descriptionTh : update.description;

                                        return (
                                            <div
                                                key={update._id}
                                                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700"
                                            >
                                                <div className="flex items-start gap-3 mb-2">
                                                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                        {update.version.split('.')[0]}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 dark:text-gray-100">
                                                            {updateTitle}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            v{update.version} •{" "}
                                                            {new Date(update.releaseDate).toLocaleDateString(
                                                                language === "th" ? "th-TH" : "en-US"
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                    {updateDesc}
                                                </p>
                                                {update.features && update.features.length > 0 && (
                                                    <ul className="space-y-1">
                                                        {update.features.slice(0, 3).map((feature, idx) => (
                                                            <li
                                                                key={idx}
                                                                className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2"
                                                            >
                                                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                                <span>
                                                                    {language === "th" ? feature.titleTh : feature.title}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer - Acknowledge Button */}
                    <div className="sticky bottom-0 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 px-6 py-4 border-t-2 border-amber-300 dark:border-amber-700">
                        <button
                            onClick={handleAcknowledge}
                            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <CheckCircle2 className="w-6 h-6" />
                            {t("Got it, Thanks!", "รับทราบแล้ว ขอบคุณ!")}
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes shine {
          0% {
            background-position: -200% -200%;
          }
          100% {
            background-position: 200% 200%;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-shine {
          animation: shine 3s linear infinite;
        }
        .delay-150 {
          animation-delay: 150ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-500 {
          animation-delay: 500ms;
        }
      `}</style>
        </div>
    );
}
