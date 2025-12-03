"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { logger } from "@/lib/logger";
import { toast } from "@/lib/toast";
import type { User } from "@/lib/types";
import { COMMON_SHORTCUTS, useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  Check,
  Inbox,
  MessageSquare,
  Send,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MessagingHubProps {
  currentUser: User;
}

type ChatMode = "direct" | "group";
type ViewMode = "inbox" | "chat";

export function MessagingHub({ currentUser }: MessagingHubProps) {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<ChatMode>("direct");
  const [viewMode, setViewMode] = useState<ViewMode>("inbox");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
    null
  );
  const [selectedSchoolId, setSelectedSchoolId] = useState<
    Id<"schools"> | null
  >(currentUser.schoolId || null);
  const [filterSchoolId, setFilterSchoolId] = useState<Id<"schools"> | null>(
    null
  );
  const [messageContent, setMessageContent] = useState("");
  const [messageContentTh, setMessageContentTh] = useState("");
  const [messageToDelete, setMessageToDelete] = useState<Id<"messages"> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      ...COMMON_SHORTCUTS.CLOSE,
      callback: () => viewMode === "chat" && setViewMode("inbox"),
      disabled: viewMode !== "chat",
    },
  ]);

  // Queries
  const availableUsers = useQuery(api.messages.getAvailableUsers, {
    currentUserId: currentUser._id,
    filterSchoolId: filterSchoolId || undefined,
  });

  const conversations = useQuery(api.messages.getConversations, {
    userId: currentUser._id,
  });

  const schools = useQuery(api.schools.list, {});

  const conversation = useQuery(
    api.messages.getConversation,
    mode === "direct" && selectedUserId
      ? {
        userId1: currentUser._id,
        userId2: selectedUserId,
      }
      : "skip"
  );

  const groupMessages = useQuery(
    api.messages.getGroupMessages,
    mode === "group" && selectedSchoolId
      ? {
        schoolId: selectedSchoolId,
      }
      : "skip"
  );

  const unreadCount = useQuery(api.messages.unreadCount, {
    userId: currentUser._id,
  });

  // Mutations
  const sendDirectMessage = useMutation(api.messages.sendDirectMessage);
  const sendGroupMessage = useMutation(api.messages.sendGroupMessage);
  const markAsRead = useMutation(api.messages.markAsRead);
  const acknowledge = useMutation(api.messages.acknowledge);
  const deleteMessage = useMutation(api.messages.deleteMessage);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, groupMessages]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() && !messageContentTh.trim()) return;

    try {
      if (mode === "direct" && selectedUserId) {
        await sendDirectMessage({
          senderId: currentUser._id,
          recipientId: selectedUserId,
          content: messageContent,
          contentTh: messageContentTh,
        });
      } else if (mode === "group" && selectedSchoolId) {
        await sendGroupMessage({
          senderId: currentUser._id,
          schoolId: selectedSchoolId,
          content: messageContent,
          contentTh: messageContentTh,
        });
      }

      // Clear inputs
      setMessageContent("");
      setMessageContentTh("");
    } catch (error) {
      logger.error("Failed to send message", error, {
        component: "MessagingHub",
        action: "sendMessage",
        userId: currentUser._id
      });
    }
  };

  const handleMarkAsRead = async (messageId: Id<"messages">) => {
    try {
      await markAsRead({ messageId });
    } catch (error) {
      logger.error("Failed to mark message as read", error, {
        component: "MessagingHub",
        action: "markAsRead",
        userId: currentUser._id
      });
    }
  };

  const handleAcknowledge = async (messageId: Id<"messages">) => {
    try {
      await acknowledge({ messageId });
    } catch (error) {
      logger.error("Failed to acknowledge message", error, {
        component: "MessagingHub",
        action: "acknowledge",
        userId: currentUser._id
      });
    }
  };

  const handleDeleteMessage = (messageId: Id<"messages">) => {
    setMessageToDelete(messageId);
  };

  const executeDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      await deleteMessage({ userId: currentUser._id, id: messageToDelete });
      setMessageToDelete(null);
    } catch (error) {
      logger.error("Failed to delete message", error, {
        component: "MessagingHub",
        action: "delete",
        userId: currentUser._id
      });
      toast.error("Failed to delete message", "ลบข้อความล้มเหลว");
    }
  };

  const messages = mode === "direct" ? conversation : groupMessages;

  const selectedUser = availableUsers?.find(
    (user) => user._id === selectedUserId
  );

  const selectedSchool = schools?.find(
    (school) => school._id === selectedSchoolId
  );

  return (
    <div className="max-w-7xl mx-auto px-0 md:px-4">
      <div className="bg-white dark:bg-gray-800 md:rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h2 className={`text-xl md:text-2xl font-bold flex items-center gap-2 ${unreadCount !== undefined && unreadCount > 0
                ? "text-red-500 animate-pulse"
                : "text-white"
                }`}>
                <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
                {t("Messaging Hub", "ศูนย์ข้อความ")}
              </h2>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={() => setViewMode("inbox")}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2.5 md:py-2 rounded-md transition-all flex items-center justify-center gap-2 text-sm md:text-base touch-manipulation active:scale-95 ${viewMode === "inbox"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/20 text-white hover:bg-white/30"
                  }`}
              >
                <Inbox className="w-4 h-4" />
                <span className="font-medium">{t("Inbox", "กล่องข้อความ")}</span>
              </button>
              <button
                onClick={() => setViewMode("chat")}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2.5 md:py-2 rounded-md transition-all flex items-center justify-center gap-2 text-sm md:text-base touch-manipulation active:scale-95 ${viewMode === "chat"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "bg-white/20 text-white hover:bg-white/30"
                  }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="font-medium">{t("Chat", "แชท")}</span>
              </button>
            </div>
          </div>

          {/* Mode Switcher - Only show in chat view */}
          {viewMode === "chat" && (
            <div className="flex gap-1 md:gap-2 bg-white/20 rounded-lg p-1 mt-3">
              <button
                onClick={() => setMode("direct")}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2.5 md:py-2 rounded-md transition-all flex items-center justify-center gap-2 text-sm md:text-base touch-manipulation active:scale-95 ${mode === "direct"
                  ? "bg-white text-blue-600 shadow-lg"
                  : "text-white hover:bg-white/10"
                  }`}
              >
                <UserPlus className="w-4 h-4" />
                <span className="font-medium">{t("Direct", "ตรง")}</span>
              </button>
              <button
                onClick={() => setMode("group")}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2.5 md:py-2 rounded-md transition-all flex items-center justify-center gap-2 text-sm md:text-base touch-manipulation active:scale-95 ${mode === "group"
                  ? "bg-white text-purple-600 shadow-lg"
                  : "text-white hover:bg-white/10"
                  }`}
              >
                <Users className="w-4 h-4" />
                <span className="font-medium">{t("Group", "กลุ่ม")}</span>
              </button>
            </div>
          )}
        </div>

        {/* Inbox View */}
        {viewMode === "inbox" && (
          <div className="p-4 md:p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {t("Your Conversations", "การสนทนาของคุณ")}
            </h3>

            {conversations === undefined ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-500 text-sm">
                  {t("Loading conversations...", "กำลังโหลดการสนทนา...")}
                </p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Inbox className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p className="text-base">{t("No conversations yet", "ยังไม่มีการสนทนา")}</p>
                <p className="text-sm mt-1">
                  {t("Start a new chat to begin messaging", "เริ่มแชทใหม่เพื่อเริ่มส่งข้อความ")}
                </p>
                <button
                  onClick={() => setViewMode("chat")}
                  className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {t("Start New Chat", "เริ่มแชทใหม่")}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => {
                      setSelectedUserId(conv.partnerId as Id<"users">);
                      setViewMode("chat");
                      setMode("direct");
                    }}
                    className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${conv.unreadCount > 0
                      ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700"
                      : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-semibold truncate ${conv.unreadCount > 0
                            ? "text-blue-900 dark:text-blue-100"
                            : "text-gray-900 dark:text-white"
                            }`}>
                            {conv.partnerUsername}
                          </h4>
                          {conv.unreadCount > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold bg-blue-500 text-white rounded-full">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-1 truncate ${conv.unreadCount > 0
                          ? "text-blue-700 dark:text-blue-200 font-medium"
                          : "text-gray-600 dark:text-gray-300"
                          }`}>
                          {language === "en" ? conv.lastMessage : conv.lastMessageTh}
                        </p>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {new Date(conv.lastMessageTime).toLocaleDateString(
                          language === "en" ? "en-US" : "th-TH",
                          {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat View */}
        {viewMode === "chat" && (
          <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100dvh-280px)] md:h-[600px]">
            {/* Sidebar - User/School Selection */}
            <div className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto hidden md:block">
              <div className="p-4">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                  {mode === "direct"
                    ? t("Available Users", "ผู้ใช้ที่พร้อมใช้งาน")
                    : t("Schools", "โรงเรียน")}
                </h3>

                {mode === "direct" && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Filter by School", "กรองตามโรงเรียน")}
                    </label>
                    <select
                      value={filterSchoolId || "all"}
                      onChange={(e) =>
                        setFilterSchoolId(
                          e.target.value === "all"
                            ? null
                            : (e.target.value as Id<"schools">)
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    >
                      <option value="all">
                        {t("All Schools", "โรงเรียนทั้งหมด")}
                      </option>
                      {schools?.map((school) => (
                        <option key={school._id} value={school._id}>
                          {language === "en" ? school.name : school.nameTh}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {mode === "direct" ? (
                  <div className="space-y-2">
                    {availableUsers === undefined ? (
                      <p className="text-gray-500 text-sm">
                        {t("Loading...", "กำลังโหลด...")}
                      </p>
                    ) : availableUsers.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        {t("No users available", "ไม่มีผู้ใช้ที่พร้อมใช้งาน")}
                      </p>
                    ) : (
                      availableUsers.map((user) => (
                        <button
                          key={user._id}
                          onClick={() => setSelectedUserId(user._id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${selectedUserId === user._id
                              ? "bg-blue-100 dark:bg-blue-900/30 border border-blue-500"
                              : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                            }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t(
                              user.role.charAt(0).toUpperCase() + user.role.slice(1),
                              user.role === "teacher"
                                ? "ครู"
                                : user.role === "moderator"
                                  ? "ผู้ดูแล"
                                  : "ผู้จัดการ"
                            )}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {language === "en"
                              ? user.schoolName
                              : user.schoolNameTh}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schools === undefined ? (
                      <p className="text-gray-500 text-sm">
                        {t("Loading...", "กำลังโหลด...")}
                      </p>
                    ) : schools.length === 0 ? (
                      <p className="text-gray-500 text-sm">
                        {t("No schools available", "ไม่มีโรงเรียน")}
                      </p>
                    ) : (
                      schools.map((school) => (
                        <button
                          key={school._id}
                          onClick={() => setSelectedSchoolId(school._id)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${selectedSchoolId === school._id
                            ? "bg-purple-100 dark:bg-purple-900/30 border border-purple-500"
                            : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {language === "en" ? school.name : school.nameTh}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="md:col-span-2 flex flex-col">
              {/* Mobile User/School Selector - Shows on mobile only */}
              <div className="md:hidden border-b border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800">
                {mode === "direct" ? (
                  <select
                    value={selectedUserId || ""}
                    onChange={(e) => setSelectedUserId(e.target.value as Id<"users"> || null)}
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation transition-shadow"
                  >
                    <option value="">{t("Select a user", "เลือกผู้ใช้")}</option>
                    {availableUsers?.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.username} - {t(
                          user.role.charAt(0).toUpperCase() + user.role.slice(1),
                          user.role === "teacher" ? "ครู" : user.role === "moderator" ? "ผู้ดูแล" : "ผู้จัดการ"
                        )}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={selectedSchoolId || ""}
                    onChange={(e) => setSelectedSchoolId(e.target.value as Id<"schools"> || null)}
                    className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white touch-manipulation transition-shadow"
                  >
                    <option value="">{t("Select a school", "เลือกโรงเรียน")}</option>
                    {schools?.map((school) => (
                      <option key={school._id} value={school._id}>
                        {language === "en" ? school.name : school.nameTh}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Chat Header */}
              <div className="p-3 md:p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                {mode === "direct" && selectedUser ? (
                  <div>
                    <h3 className="font-semibold text-base md:text-base text-gray-900 dark:text-white">
                      {selectedUser.username}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {t(
                        selectedUser.role.charAt(0).toUpperCase() +
                        selectedUser.role.slice(1),
                        selectedUser.role === "teacher"
                          ? "ครู"
                          : selectedUser.role === "moderator"
                            ? "ผู้ดูแล"
                            : "ผู้จัดการ"
                      )}
                    </p>
                  </div>
                ) : mode === "group" && selectedSchool ? (
                  <div>
                    <h3 className="font-semibold text-base md:text-base text-gray-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {language === "en"
                        ? selectedSchool.name
                        : selectedSchool.nameTh}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {t("Group Conversation", "การสนทนากลุ่ม")}
                    </p>
                  </div>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                    {t(
                      mode === "direct"
                        ? "Select a user to start chatting"
                        : "Select a school to view group chat",
                      mode === "direct"
                        ? "เลือกผู้ใช้เพื่อเริ่มแชท"
                        : "เลือกโรงเรียนเพื่อดูแชทกลุ่ม"
                    )}
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
                {messages === undefined ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm md:text-base">
                      {t("Loading messages...", "กำลังโหลดข้อความ...")}
                    </p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 md:py-8 text-gray-500">
                    <MessageSquare className="w-16 h-16 md:w-12 md:h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-base md:text-base">{t("No messages yet", "ยังไม่มีข้อความ")}</p>
                    <p className="text-sm mt-1">
                      {t(
                        "Start the conversation!",
                        "เริ่มการสนทนากันเถอะ!"
                      )}
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isOwnMessage = msg.senderId === currentUser._id;
                    const content =
                      language === "en" ? msg.content : msg.contentTh;

                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl md:rounded-lg p-3 md:p-3 shadow-md ${isOwnMessage
                            ? "bg-blue-500 text-white"
                            : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600"
                            }`}
                        >
                          {!isOwnMessage && mode === "group" && (
                            <p className="text-xs font-semibold mb-1.5 opacity-75">
                              {msg.senderUsername}
                            </p>
                          )}
                          <p className="text-sm md:text-sm leading-relaxed break-words">{content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs opacity-75">
                              {new Date(msg.createdAt).toLocaleTimeString(
                                language === "en" ? "en-US" : "th-TH",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                            {!isOwnMessage && !msg.read && (
                              <button
                                onClick={() => handleMarkAsRead(msg._id)}
                                className="text-xs hover:underline px-2 py-1 rounded touch-manipulation active:scale-95 transition-transform"
                              >
                                {t("Mark read", "อ่านแล้ว")}
                              </button>
                            )}
                            {!isOwnMessage && !msg.acknowledged && (
                              <button
                                onClick={() => handleAcknowledge(msg._id)}
                                className="text-xs hover:underline flex items-center gap-1 px-2 py-1 rounded touch-manipulation active:scale-95 transition-transform"
                              >
                                <Check className="w-3 h-3" />
                                {t("Ack", "รับทราบ")}
                              </button>
                            )}
                            {msg.acknowledged && (
                              <Check className="w-3.5 h-3.5 md:w-3 md:h-3 text-green-400" />
                            )}
                            {currentUser.role === "admin" && (
                              <button
                                onClick={() => handleDeleteMessage(msg._id)}
                                className="text-xs hover:underline flex items-center gap-1 px-2 py-1 rounded touch-manipulation active:scale-95 transition-transform text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 className="w-3 h-3" />
                                {t("Delete", "ลบ")}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 md:p-4 bg-gray-50 dark:bg-gray-800">
                {(mode === "direct" && selectedUserId) ||
                  (mode === "group" && selectedSchoolId) ? (
                  <div className="space-y-2 md:space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={messageContent}
                        onChange={(e) => setMessageContent(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        placeholder={t(
                          "Type message (English) - at least one required",
                          "พิมพ์ข้อความ (อังกฤษ) - ต้องกรอกอย่างน้อย 1 ภาษา"
                        )}
                        className="px-4 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base md:text-sm touch-manipulation transition-shadow"
                      />
                      <input
                        type="text"
                        value={messageContentTh}
                        onChange={(e) => setMessageContentTh(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSendMessage()
                        }
                        placeholder={t(
                          "Type message (Thai) - optional",
                          "พิมพ์ข้อความ (ไทย) - ไม่จำเป็น"
                        )}
                        className="px-4 py-3 md:py-2 border border-gray-300 dark:border-gray-600 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base md:text-sm touch-manipulation transition-shadow"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageContent.trim() && !messageContentTh.trim()}
                      className="w-full bg-blue-500 text-white px-4 py-3.5 md:py-2.5 rounded-xl md:rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-98 transition-all flex items-center justify-center gap-2 touch-manipulation shadow-lg shadow-blue-500/20 text-base md:text-sm font-medium"
                    >
                      <Send className="w-5 h-5 md:w-4 md:h-4" />
                      {t("Send Message", "ส่งข้อความ")}
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center text-sm md:text-sm py-2">
                    {t(
                      mode === "direct"
                        ? "Select a user to send a message"
                        : "Select a school to send a group message",
                      mode === "direct"
                        ? "เลือกผู้ใช้เพื่อส่งข้อความ"
                        : "เลือกโรงเรียนเพื่อส่งข้อความกลุ่ม"
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {messageToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              {t("Confirm Delete", "ยืนยันการลบ")}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t(
                "Are you sure you want to delete this message?",
                "คุณแน่ใจหรือไม่ว่าต้องการลบข้อความนี้?"
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setMessageToDelete(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={executeDeleteMessage}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                {t("Delete", "ลบ")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
