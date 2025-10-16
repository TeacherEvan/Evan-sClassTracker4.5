"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useState } from "react";
import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";
import { NewConversationDialog } from "./new-conversation-dialog";

interface MessagingProps {
    userId: Id<"users">;
}

export function Messaging({ userId }: MessagingProps) {
    const { t } = useLanguage();
    const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
    const [showNewConversation, setShowNewConversation] = useState(false);

    const handleConversationCreated = (conversationId: Id<"conversations">) => {
        setSelectedConversationId(conversationId);
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="grid md:grid-cols-3 h-[600px]">
                    {/* Conversation List - Left Side */}
                    <div className="border-r border-gray-200 dark:border-gray-700">
                        <ConversationList
                            userId={userId}
                            selectedConversationId={selectedConversationId}
                            onSelectConversation={setSelectedConversationId}
                            onNewConversation={() => setShowNewConversation(true)}
                        />
                    </div>

                    {/* Message Thread - Right Side */}
                    <div className="md:col-span-2">
                        {selectedConversationId ? (
                            <MessageThread
                                conversationId={selectedConversationId}
                                userId={userId}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                <p>{t("Select a conversation to start messaging", "เลือกการสนทนาเพื่อเริ่มส่งข้อความ")}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* New Conversation Dialog */}
            {showNewConversation && (
                <NewConversationDialog
                    currentUserId={userId}
                    onClose={() => setShowNewConversation(false)}
                    onConversationCreated={handleConversationCreated}
                />
            )}
        </div>
    );
}
