/**
 * Desktop Notification Toast - Corner notification window for desktop displays only
 * 
 * Features:
 * - Shows new message notifications in bottom-right corner
 * - Auto-hides after 5 seconds
 * - Click to navigate to conversation
 * - Only displays on desktop devices
 * - Supports multiple notifications (stacked)
 */

"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useIsDesktop } from "@/lib/device-context";
import { useLanguage } from "@/lib/language-context";
import { MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface NotificationData {
    id: string;
    conversationId: Id<"conversations">;
    senderName: string;
    message: string;
    timestamp: number;
}

interface DesktopNotificationToastProps {
    notifications: NotificationData[];
    onDismiss: (id: string) => void;
    onNavigate: (conversationId: Id<"conversations">) => void;
}

export function DesktopNotificationToast({
    notifications,
    onDismiss,
    onNavigate,
}: DesktopNotificationToastProps) {
    const isDesktop = useIsDesktop();

    // Don't render on mobile devices
    if (!isDesktop) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-sm">
            {notifications.map((notification) => (
                <NotificationToast
                    key={notification.id}
                    notification={notification}
                    onDismiss={onDismiss}
                    onNavigate={onNavigate}
                />
            ))}
        </div>
    );
}

interface NotificationToastProps {
    notification: NotificationData;
    onDismiss: (id: string) => void;
    onNavigate: (conversationId: Id<"conversations">) => void;
}

function NotificationToast({
    notification,
    onDismiss,
    onNavigate,
}: NotificationToastProps) {
    const { t } = useLanguage();
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    const handleDismiss = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            onDismiss(notification.id);
        }, 300); // Match animation duration
    };

    useEffect(() => {
        // Auto-dismiss after 5 seconds
        const timer = setTimeout(() => {
            handleDismiss();
        }, 5000);

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [notification.id]);

    const handleClick = () => {
        onNavigate(notification.conversationId);
        handleDismiss();
    };

    if (!isVisible) return null;

    return (
        <div
            className={`
                bg-white dark:bg-gray-800 
                border border-gray-200 dark:border-gray-700 
                rounded-lg shadow-lg 
                p-4 
                cursor-pointer 
                transition-all duration-300
                ${isExiting
                    ? "opacity-0 translate-x-full"
                    : "opacity-100 translate-x-0 hover:shadow-xl"
                }
            `}
            onClick={handleClick}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                            {notification.senderName}
                        </p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDismiss();
                            }}
                            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            aria-label={t("Dismiss", "ปิด")}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                        {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
            </div>

            {/* Progress bar (5 second countdown) */}
            <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                    className="h-full bg-blue-500 transition-all duration-5000 ease-linear"
                    style={{
                        width: isExiting ? "0%" : "100%",
                        transition: "width 5s linear",
                    }}
                />
            </div>
        </div>
    );
}
