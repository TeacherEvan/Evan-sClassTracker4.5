"use client";

import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import {
    BookOpen,
    Calendar,
    Globe,
    HelpCircle,
    LayoutDashboard,
    LineChart,
    Mail,
    MessageSquare,
    Sparkles,
    Star,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface StartupWindowProps {
    user: User;
    onNavigate: (tab: string) => void;
    onClose: () => void;
}

export function StartupWindow({
    user,
    onNavigate,
    onClose,
}: StartupWindowProps) {
    const { t, language, setLanguage } = useLanguage();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Check if user has dismissed startup window
    useEffect(() => {
        if (typeof window !== "undefined") {
            const dismissed = localStorage.getItem(
                `startupWindowDismissed_${user._id}`
            );
            if (!dismissed) {
                // Set moderators to Thai by default
                if (user.role === "moderator" && language === "en") {
                    setLanguage("th");
                }
                setIsVisible(true);
            }
        }
    }, [user._id, user.role, language, setLanguage]);

    const handleClose = (dontShowAgain: boolean = false) => {
        setIsClosing(true);
        setTimeout(() => {
            if (dontShowAgain && typeof window !== "undefined") {
                localStorage.setItem(
                    `startupWindowDismissed_${user._id}`,
                    "true"
                );
            }
            setIsVisible(false);
            setIsClosing(false);
            onClose();
        }, 500);
    };

    const handleOptionClick = (tab: string) => {
        handleClose(false);
        onNavigate(tab);
    };

    const toggleLanguage = () => {
        setLanguage(language === "en" ? "th" : "en");
    };

    if (!isVisible) return null;

    // Personalized greeting based on role
    const getGreeting = () => {
        switch (user.role) {
            case "admin":
                return {
                    en: `Welcome ${user.username}`,
                    th: `ยินดีต้อนรับ ${user.username}`,
                };
            case "moderator":
                return {
                    en: "Welcome Boss",
                    th: "ยินดีต้อนรับ บอส",
                };
            case "teacher":
                return {
                    en: "Welcome Teacher",
                    th: "ยินดีต้อนรับ ครู",
                };
            case "guardian":
                return {
                    en: "Welcome",
                    th: "ยินดีต้อนรับ",
                };
            default:
                return {
                    en: "Welcome",
                    th: "ยินดีต้อนรับ",
                };
        }
    };

    const greeting = getGreeting();
    const displayGreeting = language === "en" ? greeting.en : greeting.th;

    // Menu options
    const menuOptions = [
        {
            id: "book",
            tab: "classes",
            icon: BookOpen,
            title: t("Book a Class", "จองคลาส"),
            description: t(
                "Schedule a new class session",
                "กำหนดเวลาเรียนใหม่"
            ),
            color: "from-blue-500 to-blue-600",
            hoverColor: "hover:from-blue-600 hover:to-blue-700",
        },
        {
            id: "investigate",
            tab: user.role === "admin" ? "analytics" : "activity",
            icon: LineChart,
            title: t("Investigate", "ตรวจสอบข้อมูล"),
            description: t(
                "View logs, analytics, reports & history",
                "ดูบันทึก การวิเคราะห์ รายงาน และประวัติ"
            ),
            color: "from-purple-500 to-purple-600",
            hoverColor: "hover:from-purple-600 hover:to-purple-700",
        },
        {
            id: "reminder",
            tab: "notifications",
            icon: MessageSquare,
            title: t("Create Reminder", "สร้างการแจ้งเตือน"),
            description: t(
                "Send reminders to everyone or specific users",
                "ส่งการแจ้งเตือนให้ทุกคนหรือผู้ใช้เฉพาะ"
            ),
            color: "from-green-500 to-green-600",
            hoverColor: "hover:from-green-600 hover:to-green-700",
        },
        {
            id: "calendar",
            tab: "calendar",
            icon: Calendar,
            title: t("View Calendar", "ดูปฏิทิน"),
            description: t(
                "Check schedules and upcoming classes",
                "ตรวจสอบตารางและชั้นเรียนที่กำลังจะมาถึง"
            ),
            color: "from-orange-500 to-orange-600",
            hoverColor: "hover:from-orange-600 hover:to-orange-700",
        },
        {
            id: "messages",
            tab: "messages",
            icon: Mail,
            title: t("Messages & Inbox", "ข้อความและกล่องจดหมาย"),
            description: t(
                "Send messages and check your inbox",
                "ส่งข้อความและตรวจสอบกล่องจดหมายของคุณ"
            ),
            color: "from-pink-500 to-pink-600",
            hoverColor: "hover:from-pink-600 hover:to-pink-700",
        },
        {
            id: "help",
            tab: "help", // Special case - triggers help window modal
            icon: HelpCircle,
            title: t("Help & Features", "ช่วยเหลือและฟีเจอร์"),
            description: t(
                "Learn about all features interactively",
                "เรียนรู้เกี่ยวกับฟีเจอร์ทั้งหมดแบบโต้ตอบ"
            ),
            color: "from-teal-500 to-teal-600",
            hoverColor: "hover:from-teal-600 hover:to-teal-700",
        },
        {
            id: "dashboard",
            tab: "calendar",
            icon: LayoutDashboard,
            title: t("Something Else", "อย่างอื่น"),
            description: t(
                "Go to your default dashboard",
                "ไปที่แดชบอร์ดเริ่มต้นของคุณ"
            ),
            color: "from-gray-500 to-gray-600",
            hoverColor: "hover:from-gray-600 hover:to-gray-700",
        },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
            {/* Gold Tablet Container */}
            <div
                className={`relative max-w-4xl w-full max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl transform transition-all duration-500 ${isClosing
                        ? "scale-95 opacity-0"
                        : "scale-100 opacity-100"
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
                <div className="absolute top-4 right-16 animate-pulse delay-150">
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
                    {/* Header with language switcher and close button */}
                    <div className="sticky top-0 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 px-6 py-4 border-b-2 border-amber-300 dark:border-amber-700 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-7 h-7 text-amber-600 dark:text-amber-400" />
                            <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                                {displayGreeting}
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Language Switcher */}
                            <button
                                onClick={toggleLanguage}
                                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2 border-amber-300 dark:border-amber-700"
                                aria-label={t(
                                    "Switch Language",
                                    "สลับภาษา"
                                )}
                            >
                                <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                <span className="font-semibold text-amber-800 dark:text-amber-200">
                                    {language === "en" ? "EN" : "TH"}
                                </span>
                            </button>
                            {/* Close Button */}
                            <button
                                onClick={() => handleClose(false)}
                                className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 transition-colors p-1"
                                aria-label={t("Close", "ปิด")}
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="p-6 space-y-6">
                        {/* Welcome Message */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 border-amber-200 dark:border-amber-800">
                            <p className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                {t(
                                    "What would you like to do?",
                                    "คุณต้องการทำอะไร?"
                                )}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                                {t(
                                    "Choose an option below to get started quickly",
                                    "เลือกตัวเลือกด้านล่างเพื่อเริ่มต้นอย่างรวดเร็ว"
                                )}
                            </p>
                        </div>

                        {/* Menu Options Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {menuOptions.map((option, index) => {
                                const Icon = option.icon;
                                const isDisabled = option.disabled || false;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() =>
                                            !isDisabled &&
                                            handleOptionClick(option.tab)
                                        }
                                        disabled={isDisabled}
                                        className={`relative group text-left p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-white/50 dark:border-gray-800/50 ${isDisabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : "cursor-pointer"
                                            }`}
                                        style={{
                                            background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                                            animationDelay: `${index * 50}ms`,
                                        }}
                                        aria-label={option.title}
                                        aria-disabled={isDisabled}
                                    >
                                        <div
                                            className={`absolute inset-0 bg-gradient-to-br ${option.color} rounded-xl opacity-90 ${!isDisabled && option.hoverColor
                                                } transition-all duration-300`}
                                        />
                                        <div className="relative z-10">
                                            <div className="flex items-start gap-4">
                                                <div className="flex-shrink-0 p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                                    <Icon className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <h3 className="text-xl font-bold text-white">
                                                            {index + 1}.{" "}
                                                            {option.title}
                                                        </h3>
                                                        {isDisabled && (
                                                            <span className="text-xs px-2 py-1 bg-white/30 rounded-full text-white">
                                                                {t(
                                                                    "Coming Soon",
                                                                    "เร็วๆ นี้"
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-white/90 text-sm">
                                                        {option.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Footer with "Don't show again" option */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-amber-200 dark:border-amber-800 flex justify-between items-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {t(
                                    "Tip: You can always access these features from the main menu",
                                    "เคล็ดลับ: คุณสามารถเข้าถึงฟีเจอร์เหล่านี้ได้จากเมนูหลักเสมอ"
                                )}
                            </p>
                            <button
                                onClick={() => handleClose(true)}
                                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
                            >
                                {t("Don't show again", "ไม่ต้องแสดงอีก")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
