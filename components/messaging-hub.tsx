"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User, UserWithSchool } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import {
  Building2,
  Check,
  MessageSquare,
  Send,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface MessagingHubProps {
  currentUser: User;
}

type ChatMode = "direct" | "group";

export function MessagingHub({ currentUser }: MessagingHubProps) {
  const { t, language } = useLanguage();
  const [mode, setMode] = useState<ChatMode>("direct");
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const availableUsers = useQuery(api.messages.getAvailableUsers, {
    currentUserId: currentUser._id,
    filterSchoolId: filterSchoolId || undefined,
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, groupMessages]);

  const handleSendMessage = async () => {
    if (!messageContent.trim() || !messageContentTh.trim()) return;

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
      console.error("Failed to send message:", error);
    }
  };

  const handleMarkAsRead = async (messageId: Id<"messages">) => {
    try {
      await markAsRead({ messageId });
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  const handleAcknowledge = async (messageId: Id<"messages">) => {
    try {
      await acknowledge({ messageId });
    } catch (error) {
      console.error("Failed to acknowledge message:", error);
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
    <div className="max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-6 h-6" />
                {t("Messaging Hub", "ศูนย์ข้อความ")}
              </h2>
              {unreadCount !== undefined && unreadCount > 0 && (
                <p className="text-blue-100 mt-1">
                  {t(
                    `${unreadCount} unread message${unreadCount > 1 ? "s" : ""}`,
                    `${unreadCount} ข้อความที่ยังไม่ได้อ่าน`
                  )}
                </p>
              )}
            </div>

            {/* Mode Switcher */}
            <div className="flex gap-2 bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setMode("direct")}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${mode === "direct"
                    ? "bg-white text-blue-600"
                    : "text-white hover:bg-white/10"
                  }`}
              >
                <UserPlus className="w-4 h-4" />
                {t("Direct", "ตรง")}
              </button>
              <button
                onClick={() => setMode("group")}
                className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${mode === "group"
                    ? "bg-white text-purple-600"
                    : "text-white hover:bg-white/10"
                  }`}
              >
                <Users className="w-4 h-4" />
                {t("Group", "กลุ่ม")}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
          {/* Sidebar - User/School Selection */}
          <div className="border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
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
                    availableUsers.map((user: UserWithSchool) => (
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
                            user.role.charAt(0).toUpperCase() +
                            user.role.slice(1),
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
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              {mode === "direct" && selectedUser ? (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {selectedUser.username}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
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
                  <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {language === "en"
                      ? selectedSchool.name
                      : selectedSchool.nameTh}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("Group Conversation", "การสนทนากลุ่ม")}
                  </p>
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages === undefined ? (
                <p className="text-gray-500 text-center">
                  {t("Loading messages...", "กำลังโหลดข้อความ...")}
                </p>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>{t("No messages yet", "ยังไม่มีข้อความ")}</p>
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
                        className={`max-w-[70%] rounded-lg p-3 ${isOwnMessage
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                          }`}
                      >
                        {!isOwnMessage && mode === "group" && (
                          <p className="text-xs font-semibold mb-1 opacity-75">
                            {msg.senderUsername}
                          </p>
                        )}
                        <p className="text-sm">{content}</p>
                        <div className="flex items-center gap-2 mt-1">
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
                              className="text-xs hover:underline"
                            >
                              {t("Mark read", "อ่านแล้ว")}
                            </button>
                          )}
                          {!isOwnMessage && !msg.acknowledged && (
                            <button
                              onClick={() => handleAcknowledge(msg._id)}
                              className="text-xs hover:underline flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              {t("Ack", "รับทราบ")}
                            </button>
                          )}
                          {msg.acknowledged && (
                            <Check className="w-3 h-3 text-green-400" />
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
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
              {(mode === "direct" && selectedUserId) ||
                (mode === "group" && selectedSchoolId) ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder={t(
                        "Type message (English)",
                        "พิมพ์ข้อความ (อังกฤษ)"
                      )}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                    <input
                      type="text"
                      value={messageContentTh}
                      onChange={(e) => setMessageContentTh(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                      placeholder={t(
                        "Type message (Thai)",
                        "พิมพ์ข้อความ (ไทย)"
                      )}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageContent.trim() || !messageContentTh.trim()}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {t("Send Message", "ส่งข้อความ")}
                  </button>
                </div>
              ) : (
                <p className="text-gray-500 text-center text-sm">
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
      </div>
    </div>
  );
}
