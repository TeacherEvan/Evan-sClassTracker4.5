"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { X } from "lucide-react";
import { useState } from "react";

interface NewConversationDialogProps {
    currentUserId: Id<"users">;
    onClose: () => void;
    onConversationCreated: (conversationId: Id<"conversations">) => void;
}

export function NewConversationDialog({
    currentUserId,
    onClose,
    onConversationCreated,
}: NewConversationDialogProps) {
    const { t } = useLanguage();
    const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | "">("");
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState("");
    
    const users = useQuery(api.users.list, {});
    const createConversation = useMutation(api.conversations.create);
    const findDirect = useQuery(api.conversations.findDirect, {
        userId1: currentUserId,
        userId2: selectedUserId || currentUserId, // Fallback to avoid error
    });

    // Filter out current user from list
    const availableUsers = users?.filter((user) => user._id !== currentUserId) || [];

    const handleCreate = async () => {
        if (!selectedUserId) {
            setError(t("Please select a user", "กรุณาเลือกผู้ใช้"));
            return;
        }

        // Check if direct conversation already exists
        if (findDirect) {
            onConversationCreated(findDirect._id);
            onClose();
            return;
        }

        setCreating(true);
        setError("");

        try {
            const conversationId = await createConversation({
                participants: [currentUserId, selectedUserId as Id<"users">],
                type: "direct",
                createdBy: currentUserId,
            });

            onConversationCreated(conversationId);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create conversation");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">
                            {t("New Conversation", "การสนทนาใหม่")}
                        </h3>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="userSelect" className="block text-sm font-medium mb-2">
                                {t("Select User", "เลือกผู้ใช้")}
                            </label>
                            <select
                                id="userSelect"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value as Id<"users"> | "")}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            >
                                <option value="">{t("-- Select User --", "-- เลือกผู้ใช้ --")}</option>
                                {availableUsers.map((user) => (
                                    <option key={user._id} value={user._id}>
                                        {user.username} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={handleCreate}
                                disabled={creating || !selectedUserId}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating
                                    ? t("Creating...", "กำลังสร้าง...")
                                    : t("Start Conversation", "เริ่มการสนทนา")}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
