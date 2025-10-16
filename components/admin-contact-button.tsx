"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { MessageCircle, X, Send } from "lucide-react";
import { useState } from "react";

interface AdminContactButtonProps {
  currentUserId: Id<"users">;
  className?: string;
}

export function AdminContactButton({
  currentUserId,
  className = "",
}: AdminContactButtonProps) {
  const { t } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageContentTh, setMessageContentTh] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get admin users
  const admins = useQuery(api.users.list, { role: "admin" });
  const sendDirectMessage = useMutation(api.messages.sendDirectMessage);

  const handleSendToAdmin = async () => {
    if (!messageContent.trim() || !messageContentTh.trim()) {
      return;
    }

    if (!admins || admins.length === 0) {
      console.error("No admins found");
      return;
    }

    setIsSending(true);

    try {
      // Send message to first admin (or all admins if needed)
      const adminId = admins[0]._id;
      await sendDirectMessage({
        senderId: currentUserId,
        recipientId: adminId,
        content: messageContent,
        contentTh: messageContentTh,
      });

      // Clear inputs and close dialog
      setMessageContent("");
      setMessageContentTh("");
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to send message to admin:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Contact Button */}
      <button
        onClick={() => setShowDialog(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg ${className}`}
      >
        <MessageCircle className="w-5 h-5" />
        {t("Contact Admin", "ติดต่อผู้จัดการ")}
      </button>

      {/* Contact Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t("Contact Admin", "ติดต่อผู้จัดการ")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {t(
                    "Send a message to the administrator",
                    "ส่งข้อความถึงผู้จัดการระบบ"
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              {admins === undefined ? (
                <p className="text-gray-500 text-center">
                  {t("Loading...", "กำลังโหลด...")}
                </p>
              ) : admins.length === 0 ? (
                <p className="text-red-500 text-center">
                  {t("No admin users found", "ไม่พบผู้จัดการระบบ")}
                </p>
              ) : (
                <>
                  {/* Message to admin info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {t(
                        `Your message will be sent to: ${admins[0].username}`,
                        `ข้อความจะถูกส่งไปยัง: ${admins[0].username}`
                      )}
                    </p>
                  </div>

                  {/* Message Inputs */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Message (English)", "ข้อความ (อังกฤษ)")}
                    </label>
                    <textarea
                      value={messageContent}
                      onChange={(e) => setMessageContent(e.target.value)}
                      placeholder={t(
                        "Type your message in English...",
                        "พิมพ์ข้อความของคุณเป็นภาษาอังกฤษ..."
                      )}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Message (Thai)", "ข้อความ (ไทย)")}
                    </label>
                    <textarea
                      value={messageContentTh}
                      onChange={(e) => setMessageContentTh(e.target.value)}
                      placeholder={t(
                        "Type your message in Thai...",
                        "พิมพ์ข้อความของคุณเป็นภาษาไทย..."
                      )}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={handleSendToAdmin}
                disabled={
                  !messageContent.trim() ||
                  !messageContentTh.trim() ||
                  isSending ||
                  !admins ||
                  admins.length === 0
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                {isSending
                  ? t("Sending...", "กำลังส่ง...")
                  : t("Send", "ส่ง")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
