"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import {
  Bell,
  Bug,
  HelpCircle,
  Lightbulb,
  MessageCircle,
  MessageSquare,
  Send,
  X
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

interface AdminContactButtonProps {
  currentUserId: Id<"users">;
  className?: string;
}

type RequestType = "general" | "feature_suggestion" | "bug_report" | "help_request" | "notification_window_request";

export function AdminContactButton({
  currentUserId,
  className = "",
}: AdminContactButtonProps) {
  const { t } = useLanguage();
  const [showDialog, setShowDialog] = useState(false);
  const [requestType, setRequestType] = useState<RequestType>("general");
  const [subject, setSubject] = useState("");
  const [subjectTh, setSubjectTh] = useState("");
  const [message, setMessage] = useState("");
  const [messageTh, setMessageTh] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const currentUser = useQuery(api.users.getById, { id: currentUserId });
  const createContactRequest = useMutation(api.adminContactRequests.create);
  const generateUploadUrl = useMutation(api.adminContactRequests.generateUploadUrl);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Invalid file type. Please select an image file.",
        "ประเภทไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์รูปภาพ"
      );
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        "File size exceeds 5MB limit",
        "ขนาดไฟล์เกิน 5MB"
      );
      return;
    }

    setSelectedFile(file);
  };

  const uploadFile = async (): Promise<{
    storageId: string;
    name: string;
    type: string;
    size: number;
  } | null> => {
    if (!selectedFile) return null;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl({ userId: currentUserId });

      // Upload file
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": selectedFile.type },
        body: selectedFile,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const { storageId } = await response.json();

      setUploadProgress(100);

      return {
        storageId,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      };
    } catch (error) {
      console.error("File upload error:", error);
      toast.error(
        "Failed to upload file",
        "อัปโหลดไฟล์ล้มเหลว"
      );
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate input
    if (!subject.trim() && !subjectTh.trim()) {
      toast.warning(
        "Please provide a subject",
        "กรุณาระบุหัวเรื่อง"
      );
      return;
    }

    if (!message.trim() && !messageTh.trim()) {
      toast.warning(
        "Please provide a message",
        "กรุณาระบุข้อความ"
      );
      return;
    }

    setIsSending(true);

    try {
      // Upload file if selected
      let attachmentData = null;
      if (selectedFile) {
        attachmentData = await uploadFile();
        if (!attachmentData) {
          setIsSending(false);
          return;
        }
      }

      await createContactRequest({
        userId: currentUserId,
        requestType,
        subject,
        subjectTh,
        message,
        messageTh,
        attachmentStorageId: attachmentData?.storageId as Id<"_storage"> | undefined,
        attachmentName: attachmentData?.name,
        attachmentType: attachmentData?.type,
        attachmentSize: attachmentData?.size,
      });

      toast.success(
        "Your request has been sent to the administrator",
        "คำขอของคุณถูกส่งไปยังผู้จัดการแล้ว"
      );

      // Clear inputs and close dialog
      setSubject("");
      setSubjectTh("");
      setMessage("");
      setMessageTh("");
      setSelectedFile(null);
      setRequestType("general");
      setShowDialog(false);
    } catch (error) {
      console.error("Failed to send contact request:", error);
      toast.error(
        "Failed to send request. Please try again.",
        "การส่งคำขอล้มเหลว กรุณาลองอีกครั้ง"
      );
    } finally {
      setIsSending(false);
    }
  };

  const getRequestTypeInfo = (type: RequestType) => {
    switch (type) {
      case "feature_suggestion":
        return {
          icon: <Lightbulb className="w-5 h-5" />,
          title: t("Feature Suggestion", "ข้อเสนอฟีเจอร์ใหม่"),
          color: "from-yellow-500 to-orange-500",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          borderColor: "border-yellow-200 dark:border-yellow-800"
        };
      case "bug_report":
        return {
          icon: <Bug className="w-5 h-5" />,
          title: t("Bug Report", "รายงานข้อผิดพลาด"),
          color: "from-red-500 to-pink-500",
          bgColor: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-200 dark:border-red-800"
        };
      case "help_request":
        return {
          icon: <HelpCircle className="w-5 h-5" />,
          title: t("Help Request", "ขอความช่วยเหลือ"),
          color: "from-blue-500 to-purple-500",
          bgColor: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-200 dark:border-blue-800"
        };
      case "notification_window_request":
        return {
          icon: <Bell className="w-5 h-5" />,
          title: t("Notification Window Request", "ขอหน้าต่างประกาศ"),
          color: "from-indigo-500 to-purple-500",
          bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
          borderColor: "border-indigo-200 dark:border-indigo-800"
        };
      default:
        return {
          icon: <MessageSquare className="w-5 h-5" />,
          title: t("General Inquiry", "สอบถามทั่วไป"),
          color: "from-gray-500 to-gray-600",
          bgColor: "bg-gray-50 dark:bg-gray-900/20",
          borderColor: "border-gray-200 dark:border-gray-800"
        };
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

      {/* Enhanced Contact Dialog - Rendered via Portal to escape stacking context */}
      {showDialog && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-7 h-7" />
                    {t("Contact Administrator", "ติดต่อผู้จัดการระบบ")}
                  </h2>
                  <p className="text-sm text-white/90 mt-1">
                    {t(
                      "Get help, report issues, or suggest improvements",
                      "ขอความช่วยเหลือ รายงานปัญหา หรือเสนอแนะการปรับปรุง"
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-white/90 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-6">
              {/* User Info Card */}
              {currentUser && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t("Submitting as", "ส่งในนาม")}:{" "}
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      {currentUser.username}
                    </span>{" "}
                    <span className="text-gray-500 dark:text-gray-400">
                      ({currentUser.role})
                    </span>
                  </p>
                </div>
              )}

              {/* Request Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  {t("Request Type", "ประเภทคำขอ")}
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(["general", "feature_suggestion", "bug_report", "help_request", "notification_window_request"] as RequestType[]).map((type) => {
                    const info = getRequestTypeInfo(type);
                    const isSelected = requestType === type;

                    // Only show notification_window_request for non-admins
                    if (type === "notification_window_request" && currentUser?.role === "admin") {
                      return null;
                    }

                    return (
                      <button
                        key={type}
                        onClick={() => setRequestType(type)}
                        className={`p-3 rounded-xl border-2 transition-all ${isSelected
                          ? `${info.bgColor} ${info.borderColor} shadow-md scale-[1.02]`
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow"
                          }`}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          <div className={`${isSelected ? "text-orange-600 dark:text-orange-400" : "text-gray-600 dark:text-gray-400"}`}>
                            {info.icon}
                          </div>
                          <span className={`text-xs font-medium ${isSelected ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                            {info.title}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Request Type Description */}
              {requestType === "notification_window_request" && (
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                  <p className="text-sm text-indigo-800 dark:text-indigo-200">
                    {t(
                      "Request a notification window to communicate important updates to all users. Admin will review and create if approved.",
                      "ขอหน้าต่างประกาศเพื่อสื่อสารข้อมูลสำคัญกับผู้ใช้ทั้งหมด ผู้จัดการจะพิจารณาและสร้างหากได้รับการอนุมัติ"
                    )}
                  </p>
                </div>
              )}

              {/* Subject Inputs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Subject", "หัวเรื่อง")}
                  <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                    {t("(At least one language required)", "(ต้องระบุอย่างน้อยหนึ่งภาษา)")}
                  </span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t(
                    "Brief subject in English...",
                    "หัวเรื่องสั้นๆ เป็นภาษาอังกฤษ..."
                  )}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all"
                />
                <input
                  type="text"
                  value={subjectTh}
                  onChange={(e) => setSubjectTh(e.target.value)}
                  placeholder={t(
                    "Brief subject in Thai (optional)...",
                    "หัวเรื่องสั้นๆ เป็นภาษาไทย (ไม่บังคับ)..."
                  )}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white transition-all mt-2"
                />
              </div>

              {/* Message Inputs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Message", "ข้อความ")}
                  <span className="ml-2 text-xs font-normal text-blue-600 dark:text-blue-400">
                    {t("(At least one language required)", "(ต้องระบุอย่างน้อยหนึ่งภาษา)")}
                  </span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t(
                    "Describe your request in detail (English)...",
                    "อธิบายคำขอของคุณโดยละเอียด (อังกฤษ)..."
                  )}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white resize-none transition-all"
                />
                <textarea
                  value={messageTh}
                  onChange={(e) => setMessageTh(e.target.value)}
                  placeholder={t(
                    "Describe your request in Thai (optional)...",
                    "อธิบายคำขอของคุณเป็นภาษาไทย (ไม่บังคับ)..."
                  )}
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white resize-none transition-all mt-2"
                />
              </div>

              {/* Screenshot Attachment */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t("Attach Screenshot (Optional)", "แนบภาพหน้าจอ (ไม่บังคับ)")}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={isSending || isUploading}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 dark:file:bg-blue-900/30 dark:file:text-blue-300"
                />
                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mt-2">
                    <MessageCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      disabled={isSending || isUploading}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {isUploading && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 p-6 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all font-medium"
              >
                {t("Cancel", "ยกเลิก")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  (!subject.trim() && !subjectTh.trim()) ||
                  (!message.trim() && !messageTh.trim()) ||
                  isSending
                }
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg disabled:shadow-none font-medium"
              >
                <Send className="w-5 h-5" />
                {isSending
                  ? t("Sending...", "กำลังส่ง...")
                  : t("Send Request", "ส่งคำขอ")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
