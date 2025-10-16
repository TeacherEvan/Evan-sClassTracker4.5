"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { formatRelativeTime } from "@/lib/date-utils";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MessageThreadProps {
    conversationId: Id<"conversations">;
    userId: Id<"users">;
}

export function MessageThread({ conversationId, userId }: MessageThreadProps) {
    const { t, language } = useLanguage();
    const messages = useQuery(api.messages.list, { conversationId });
    const users = useQuery(api.users.list, {});
    const sendMessage = useMutation(api.messages.send);
    const markAsRead = useMutation(api.messages.markConversationAsRead);

    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Mark messages as read when conversation opens
    useEffect(() => {
        if (conversationId) {
            markAsRead({ conversationId, userId });
        }
    }, [conversationId, userId, markAsRead]);

    const getUserById = (id: Id<"users">) => {
        return users?.find((u) => u._id === id);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await sendMessage({
                conversationId,
                senderId: userId,
                content: newMessage.trim(),
            });
            setNewMessage("");
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    if (!messages) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        <p>{t("No messages yet. Start the conversation!", "ยังไม่มีข้อความ เริ่มการสนทนากันเลย!")}</p>
                    </div>
                ) : (
                    messages.map((message) => {
                        const sender = getUserById(message.senderId);
                        const isOwnMessage = message.senderId === userId;

                        return (
                            <div
                                key={message._id}
                                className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        }`}
                                >
                                    {!isOwnMessage && (
                                        <div className="text-xs font-semibold mb-1 opacity-75">
                                            {sender?.username || t("Unknown", "ไม่ทราบ")}
                                        </div>
                                    )}
                                    <div className="break-words">{message.content}</div>
                                    <div
                                        className={`text-xs mt-1 ${isOwnMessage ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                            }`}
                                    >
                                        {formatRelativeTime(message.createdAt, language)}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t("Type a message...", "พิมพ์ข้อความ...")}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        {sending ? t("Sending...", "กำลังส่ง...") : t("Send", "ส่ง")}
                    </button>
                </form>
            </div>
        </div>
    );
}
