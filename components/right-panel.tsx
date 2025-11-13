"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import { Bell, MessageSquare, X } from "lucide-react";
import { useState } from "react";

interface RightPanelProps {
    userId: Id<"users">;
    onClose: () => void;
}

type PanelTab = "messages" | "notifications";

export default function RightPanel({ userId, onClose }: RightPanelProps) {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<PanelTab>("messages");

    // Query unread counts using the correct API endpoints
    const unreadMessages = useQuery(api.messages.unreadCount, { userId }) || 0;
    const unreadNotifications = useQuery(api.notifications.unreadCount, { userId: userId.toString() }) || 0;

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {t("Quick Access", "เข้าถึงอย่างรวดเร็ว")}
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label={t("Close panel", "ปิดแผง")}
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab("messages")}
                    className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative
            ${activeTab === "messages"
                            ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }
          `}
                >
                    <MessageSquare className="w-4 h-4" />
                    {t("Messages", "ข้อความ")}
                    {unreadMessages > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadMessages > 9 ? "9+" : unreadMessages}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("notifications")}
                    className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative
            ${activeTab === "notifications"
                            ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        }
          `}
                >
                    <Bell className="w-4 h-4" />
                    {t("Notifications", "การแจ้งเตือน")}
                    {unreadNotifications > 0 && (
                        <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {unreadNotifications > 9 ? "9+" : unreadNotifications}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === "messages" ? (
                    <MessagesQuickView userId={userId} />
                ) : (
                    <NotificationsQuickView userId={userId} />
                )}
            </div>
        </div>
    );
}

function MessagesQuickView({ userId }: { userId: Id<"users"> }) {
    const { t } = useLanguage();
    // Use list query with limit parameter
    const allMessages = useQuery(api.messages.list, { userId });
    const messages = allMessages?.slice(0, 10); // Get recent 10 messages

    if (!messages) {
        return (
            <div className="p-4 text-center text-gray-500">
                {t("Loading...", "กำลังโหลด...")}
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                {t("No messages", "ไม่มีข้อความ")}
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {messages.map((message: Doc<"messages">) => (
                <div
                    key={message._id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${!message.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                        }`}
                >
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                            M
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {t("Message", "ข้อความ")}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {message.content || message.contentTh}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {new Date(message._creationTime).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function NotificationsQuickView({ userId }: { userId: Id<"users"> }) {
    const { t } = useLanguage();
    // Use list query and get recent notifications
    const allNotifications = useQuery(api.notifications.list, { userId: userId.toString() });
    const notifications = allNotifications?.slice(0, 10); // Get recent 10 notifications

    if (!notifications) {
        return (
            <div className="p-4 text-center text-gray-500">
                {t("Loading...", "กำลังโหลด...")}
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="p-4 text-center text-gray-500">
                {t("No notifications", "ไม่มีการแจ้งเตือน")}
            </div>
        );
    }

    return (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {notifications.map((notification: Doc<"notifications">) => (
                <div
                    key={notification._id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${!notification.read ? "bg-blue-50 dark:bg-blue-900/10" : ""
                        }`}
                >
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        {notification.title || notification.titleTh}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {notification.message || notification.messageTh}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                        {new Date(notification._creationTime).toLocaleDateString()}
                    </p>
                </div>
            ))}
        </div>
    );
}
