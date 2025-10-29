"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import {
    Calendar,
    CheckCircle2,
    Edit3,
    FileText,
    Sparkles,
    X,
} from "lucide-react";
import { useMemo } from "react";

interface UpdateAnnouncementModalProps {
    update: Doc<"appUpdates">;
    onClose: () => void;
}

// Icon mapping
const iconComponents = {
    Calendar,
    CheckCircle2,
    Edit3,
    FileText,
    Sparkles,
};

export function UpdateAnnouncementModal({ update, onClose }: UpdateAnnouncementModalProps) {
    const { t, language } = useLanguage();

    const title = language === "th" ? update.titleTh : update.title;
    const description = language === "th" ? update.descriptionTh : update.description;

    const features = useMemo(
        () =>
            update.features.map((feature) => ({
                title: language === "th" ? feature.titleTh : feature.title,
                description: language === "th" ? feature.descriptionTh : feature.description,
                icon: feature.icon,
            })),
        [update.features, language]
    );

    const getIcon = (iconName: string) => {
        const Icon = iconComponents[iconName as keyof typeof iconComponents] || Sparkles;
        return Icon;
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-500">
                {/* Header with gradient */}
                <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 p-8 rounded-t-3xl">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
                        aria-label={t("Close", "ปิด")}
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <p className="text-white/80 text-sm font-medium">
                                {t("Version", "เวอร์ชัน")} {update.version}
                            </p>
                            <p className="text-white/60 text-xs">
                                {new Date(update.releaseDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                            </p>
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-3">{title}</h1>
                    <p className="text-white/90 text-lg">{description}</p>
                </div>

                {/* Features */}
                <div className="p-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                        {t("What's New", "มีอะไรใหม่")}
                    </h2>

                    <div className="grid gap-6 md:grid-cols-2">
                        {features.map((feature, index) => {
                            const Icon = getIcon(feature.icon);
                            return (
                                <div
                                    key={index}
                                    className="group p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-600"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-blue-600 text-white rounded-xl group-hover:scale-110 transition-transform duration-300">
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
                                                {feature.title}
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                                {feature.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Call to action */}
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h3 className="font-semibold text-lg mb-1">
                                    {t("Ready to explore?", "พร้อมสำรวจแล้วหรือยัง?")}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(
                                        "Start using these new features now!",
                                        "เริ่มใช้ฟีเจอร์ใหม่เหล่านี้ตอนนี้เลย!"
                                    )}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                {t("Got it!", "เข้าใจแล้ว!")}
                            </button>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        {t(
                            "You won't see this message again for this update.",
                            "คุณจะไม่เห็นข้อความนี้อีกสำหรับการอัปเดตนี้"
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
