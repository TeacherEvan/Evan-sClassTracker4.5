/**
 * Messaging Hub - Enhanced messaging interface with categorized access
 * 
 * Provides buttons for:
 * - Available Users (by school)
 * - Groups
 * - Moderators
 * - Evan/Admin
 * - Messages (all conversations)
 */

"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Inbox, MessageCircle, School, ShieldCheck, UserCog, Users } from "lucide-react";
import { useState } from "react";
import { ConversationList } from "./conversation-list";
import { MessageThread } from "./message-thread";
import { NewConversationDialog } from "./new-conversation-dialog";

interface MessagingHubProps {
    userId: Id<"users">;
    userRole: "teacher" | "moderator" | "admin";
}

type ViewMode =
    | "all-messages"
    | "available-users"
    | "groups"
    | "moderators"
    | "admin";

export function MessagingHub({ userId }: MessagingHubProps) {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<ViewMode>("all-messages");
    const [selectedConversationId, setSelectedConversationId] = useState<Id<"conversations"> | null>(null);
    const [showNewConversation, setShowNewConversation] = useState(false);
    const [selectedSchoolId, setSelectedSchoolId] = useState<Id<"schools"> | null>(null);

    // Queries
    const schools = useQuery(api.schools.list);
    const moderators = useQuery(api.conversations.getModerators, { currentUserId: userId });
    const admin = useQuery(api.conversations.getAdmin);
    const groupConversations = useQuery(api.conversations.getGroupConversations, { userId });
    const usersBySchool = useQuery(
        api.conversations.getUsersBySchool,
        selectedSchoolId ? { schoolId: selectedSchoolId, currentUserId: userId } : "skip"
    );

    // Mutations
    const createConversation = useMutation(api.conversations.create);

    const handleCategoryClick = (mode: ViewMode) => {
        setViewMode(mode);
        setSelectedConversationId(null);
        setSelectedSchoolId(null);
    };

    const handleConversationCreated = (conversationId: Id<"conversations">) => {
        setSelectedConversationId(conversationId);
        setShowNewConversation(false);
        setViewMode("all-messages");
    };

    const handleStartChat = async (otherUserId: Id<"users">) => {
        try {
            const conversationId = await createConversation({
                participants: [userId, otherUserId],
                type: "direct",
                createdBy: userId,
            });
            setSelectedConversationId(conversationId);
            setViewMode("all-messages");
        } catch (error) {
            console.error("Failed to start chat:", error);
        }
    };

    const handleSchoolSelect = (schoolId: Id<"schools">) => {
        setSelectedSchoolId(schoolId);
    };

    const handleBackToSchools = () => {
        setSelectedSchoolId(null);
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* Category Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-t-lg shadow-lg border-b border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-wrap gap-2">
                    {/* Available Users Button */}
                    <button
                        onClick={() => handleCategoryClick("available-users")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === "available-users"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                    >
                        <School className="w-5 h-5" />
                        <span className="font-medium">
                            {t("Available Users", "ผู้ใช้ที่มี")}
                        </span>
                    </button>

                    {/* Groups Button */}
                    <button
                        onClick={() => handleCategoryClick("groups")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === "groups"
                            ? "bg-green-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                    >
                        <Users className="w-5 h-5" />
                        <span className="font-medium">
                            {t("Groups", "กลุ่ม")}
                        </span>
                    </button>

                    {/* Moderators Button */}
                    <button
                        onClick={() => handleCategoryClick("moderators")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === "moderators"
                            ? "bg-purple-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                    >
                        <UserCog className="w-5 h-5" />
                        <span className="font-medium">
                            {t("Moderators", "ผู้ดูแล")}
                        </span>
                    </button>

                    {/* Evan/Admin Button */}
                    <button
                        onClick={() => handleCategoryClick("admin")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === "admin"
                            ? "bg-red-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                    >
                        <ShieldCheck className="w-5 h-5" />
                        <span className="font-medium">
                            {t("Evan/Admin", "อีวาน/ผู้ดูแลระบบ")}
                        </span>
                    </button>

                    {/* Messages Button (All Conversations) */}
                    <button
                        onClick={() => handleCategoryClick("all-messages")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${viewMode === "all-messages"
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                            }`}
                    >
                        <Inbox className="w-5 h-5" />
                        <span className="font-medium">
                            {t("Messages", "ข้อความ")}
                        </span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white dark:bg-gray-800 rounded-b-lg shadow-lg overflow-hidden">
                <div className="grid md:grid-cols-3 h-[600px]">
                    {/* Left Side - Conversation List or Category View */}
                    <div className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
                        {/* All Messages View */}
                        {viewMode === "all-messages" && (
                            <ConversationList
                                userId={userId}
                                selectedConversationId={selectedConversationId}
                                onSelectConversation={setSelectedConversationId}
                                onNewConversation={() => setShowNewConversation(true)}
                            />
                        )}

                        {/* Available Users View - School Selection */}
                        {viewMode === "available-users" && !selectedSchoolId && (
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-4">
                                    {t("Select School", "เลือกโรงเรียน")}
                                </h3>
                                {!schools ? (
                                    <div className="text-gray-500">{t("Loading...", "กำลังโหลด...")}</div>
                                ) : schools.length === 0 ? (
                                    <div className="text-gray-500">
                                        {t("No schools found", "ไม่พบโรงเรียน")}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {schools.map((school) => (
                                            <button
                                                key={school._id}
                                                onClick={() => handleSchoolSelect(school._id)}
                                                className="w-full p-3 text-left border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <div className="font-medium">{school.name}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {school.nameTh}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Available Users View - User List */}
                        {viewMode === "available-users" && selectedSchoolId && (
                            <div className="p-4">
                                <button
                                    onClick={handleBackToSchools}
                                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600 mb-4"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    {t("Back to Schools", "กลับไปที่โรงเรียน")}
                                </button>
                                <h3 className="text-lg font-semibold mb-4">
                                    {t("Available Users", "ผู้ใช้ที่มี")}
                                </h3>
                                {!usersBySchool ? (
                                    <div className="text-gray-500">{t("Loading...", "กำลังโหลด...")}</div>
                                ) : usersBySchool.length === 0 ? (
                                    <div className="text-gray-500">
                                        {t("No users found in this school", "ไม่พบผู้ใช้ในโรงเรียนนี้")}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {usersBySchool.map((user) => (
                                            <div
                                                key={user._id}
                                                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {user.username}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {user.role}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleStartChat(user._id)}
                                                        className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                                                    >
                                                        {t("Message", "ส่งข้อความ")}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Groups View */}
                        {viewMode === "groups" && (
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-4">
                                    {t("Group Conversations", "การสนทนากลุ่ม")}
                                </h3>
                                {!groupConversations ? (
                                    <div className="text-gray-500">{t("Loading...", "กำลังโหลด...")}</div>
                                ) : groupConversations.length === 0 ? (
                                    <div className="text-gray-500">
                                        {t("No group conversations found", "ไม่พบการสนทนากลุ่ม")}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {groupConversations.map((conv) => (
                                            <button
                                                key={conv._id}
                                                onClick={() => setSelectedConversationId(conv._id)}
                                                className={`w-full p-3 text-left border rounded-lg transition-colors ${selectedConversationId === conv._id
                                                        ? "bg-blue-50 border-blue-500 dark:bg-blue-900 dark:border-blue-400"
                                                        : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Users className="w-5 h-5" />
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {t("Group", "กลุ่ม")} ({conv.participants.length}{" "}
                                                            {t("members", "สมาชิก")})
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {new Date(conv.lastMessageAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Moderators View */}
                        {viewMode === "moderators" && (
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-4">
                                    {t("Moderators", "ผู้ดูแล")}
                                </h3>
                                {!moderators ? (
                                    <div className="text-gray-500">{t("Loading...", "กำลังโหลด...")}</div>
                                ) : moderators.length === 0 ? (
                                    <div className="text-gray-500">
                                        {t("No moderators found", "ไม่พบผู้ดูแล")}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {moderators.map((moderator) => (
                                            <div
                                                key={moderator._id}
                                                className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {moderator.username}
                                                        </div>
                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                            {t("Moderator", "ผู้ดูแล")}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleStartChat(moderator._id)}
                                                        className="px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                                                    >
                                                        {t("Message", "ส่งข้อความ")}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Admin View */}
                        {viewMode === "admin" && (
                            <div className="p-4">
                                <h3 className="text-lg font-semibold mb-4">
                                    {t("Contact Admin", "ติดต่อผู้ดูแลระบบ")}
                                </h3>
                                {!admin ? (
                                    <div className="text-gray-500">{t("Loading...", "กำลังโหลด...")}</div>
                                ) : (
                                    <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-red-50 dark:bg-red-900/20">
                                        <div className="flex items-start gap-3 mb-4">
                                            <ShieldCheck className="w-8 h-8 text-red-500" />
                                            <div className="flex-1">
                                                <div className="font-semibold text-lg">
                                                    {admin.username}
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    {t("System Administrator", "ผู้ดูแลระบบ")}
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                                            {t(
                                                "Contact the system administrator for technical support, account issues, or urgent matters.",
                                                "ติดต่อผู้ดูแลระบบสำหรับการสนับสนุนทางเทคนิค ปัญหาบัญชี หรือเรื่องเร่งด่วน"
                                            )}
                                        </p>
                                        <button
                                            onClick={() => handleStartChat(admin._id)}
                                            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                                        >
                                            {t("Message Admin", "ส่งข้อความถึงผู้ดูแลระบบ")}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Side - Message Thread */}
                    <div className="md:col-span-2">
                        {selectedConversationId ? (
                            <MessageThread
                                conversationId={selectedConversationId}
                                userId={userId}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8 text-center">
                                <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">
                                    {t("Select a conversation", "เลือกการสนทนา")}
                                </p>
                                <p className="text-sm">
                                    {t(
                                        "Choose a category and select a conversation to start messaging",
                                        "เลือกหมวดหมู่และเลือกการสนทนาเพื่อเริ่มส่งข้อความ"
                                    )}
                                </p>
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
