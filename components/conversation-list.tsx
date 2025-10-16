"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatRelativeTime } from "@/lib/date-utils";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import { MessageCircle, Users as UsersIcon } from "lucide-react";

interface Conversation {
    _id: Id<"conversations">;
    type: "direct" | "group";
    name?: string;
    nameTh?: string;
    participants: Id<"users">[];
    lastMessageAt: number;
}

interface ConversationItemProps {
    conversation: Conversation;
    userId: Id<"users">;
    isSelected: boolean;
    onSelect: () => void;
    getConversationName: (conv: Conversation) => string;
}

function ConversationItem({
    conversation,
    userId,
    isSelected,
    onSelect,
    getConversationName,
}: ConversationItemProps) {
    const { language } = useLanguage();
    const unreadCount = useQuery(api.messages.getConversationUnreadCount, {
        conversationId: conversation._id,
        userId,
    });

    return (
        <button
            onClick={onSelect}
            className={`w-full p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {conversation.type === "group" && (
                            <UsersIcon className="w-4 h-4 text-gray-400" />
                        )}
                        <h3 className="font-semibold truncate">
                            {getConversationName(conversation)}
                        </h3>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatRelativeTime(conversation.lastMessageAt, language)}
                    </p>
                </div>
                {unreadCount !== undefined && unreadCount > 0 && (
                    <div className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </div>
                )}
            </div>
        </button>
    );
}

interface ConversationListProps {
    userId: Id<"users">;
    selectedConversationId: Id<"conversations"> | null;
    onSelectConversation: (conversationId: Id<"conversations">) => void;
    onNewConversation: () => void;
}

export function ConversationList({
    userId,
    selectedConversationId,
    onSelectConversation,
    onNewConversation,
}: ConversationListProps) {
    const { t, language } = useLanguage();
    const conversations = useQuery(api.conversations.list, { userId });
    const users = useQuery(api.users.list, {});

    // Get user by ID helper
    const getUserById = (id: Id<"users">) => {
        return users?.find((u) => u._id === id);
    };

    // Get conversation display name
    const getConversationName = (conv: {
        type: "direct" | "group";
        name?: string;
        nameTh?: string;
        participants: Id<"users">[];
    }): string => {
        if (conv.type === "group") {
            const groupName = language === "en" ? conv.name : conv.nameTh;
            return groupName || t("Unnamed Group", "กลุ่มไม่มีชื่อ");
        }

        // For direct conversations, show the other participant's name
        const otherUserId = conv.participants.find((id: Id<"users">) => id !== userId);
        const otherUser = getUserById(otherUserId!);
        return otherUser?.username || t("Unknown User", "ผู้ใช้ที่ไม่รู้จัก");
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        {t("Messages", "ข้อความ")}
                    </h2>
                    <button
                        onClick={onNewConversation}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                        {t("New", "ใหม่")}
                    </button>
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
                {!conversations || conversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>{t("No conversations yet", "ยังไม่มีการสนทนา")}</p>
                        <button
                            onClick={onNewConversation}
                            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            {t("Start a conversation", "เริ่มการสนทนา")}
                        </button>
                    </div>
                ) : (
                    conversations.map((conv) => (
                        <ConversationItem
                            key={conv._id}
                            conversation={conv}
                            userId={userId}
                            isSelected={conv._id === selectedConversationId}
                            onSelect={() => onSelectConversation(conv._id)}
                            getConversationName={getConversationName}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
