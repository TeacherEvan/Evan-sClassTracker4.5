"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, Send, X } from "lucide-react";
import { useState } from "react";

interface MessageWizardProps {
    userId: Id<"users">;
    userRole: "teacher" | "moderator";
    userSchoolId?: Id<"schools">;
    onComplete: () => void;
    onClose: () => void;
}

type WizardStep = "recipients" | "compose" | "sending";

export function MessageWizard({
    userId,
    userRole,
    userSchoolId,
    onComplete,
    onClose,
}: MessageWizardProps) {
    const { t } = useLanguage();

    const [currentStep, setCurrentStep] = useState<WizardStep>("recipients");
    const [selectedRecipients, setSelectedRecipients] = useState<Id<"users">[]>([]);
    const [message, setMessage] = useState("");
    const [messageTh, setMessageTh] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Get teachers for moderator's school or all teachers/moderators for admin
    const allUsers = useQuery(api.users.list, {});
    const availableRecipients = allUsers?.filter(u => {
        // Can't message yourself
        if (u._id === userId) return false;

        if (userRole === "moderator") {
            // Moderators can message teachers in their school
            return u.role === "teacher" && u.schoolId === userSchoolId;
        }

        // Teachers can message other teachers and moderators
        return u.role === "teacher" || u.role === "moderator";
    });

    const sendDirectMessage = useMutation(api.messages.sendDirectMessage);

    const toggleRecipient = (recipientId: Id<"users">) => {
        if (selectedRecipients.includes(recipientId)) {
            setSelectedRecipients(selectedRecipients.filter(id => id !== recipientId));
        } else {
            setSelectedRecipients([...selectedRecipients, recipientId]);
        }
    };

    const handleNext = () => {
        if (currentStep === "recipients" && selectedRecipients.length > 0) {
            setCurrentStep("compose");
        }
    };

    const handleBack = () => {
        if (currentStep === "compose") setCurrentStep("recipients");
    };

    const handleSend = async () => {
        if (!message.trim() && !messageTh.trim()) {
            toast.error(
                "Please provide message in at least one language",
                "กรุณากรอกข้อความในอย่างน้อยหนึ่งภาษา"
            );
            return;
        }

        setIsSending(true);
        setCurrentStep("sending");

        try {
            // Send message to each recipient
            for (const recipientId of selectedRecipients) {
                await sendDirectMessage({
                    senderId: userId,
                    recipientId,
                    content: message,
                    contentTh: messageTh,
                });
            }

            toast.success(
                `Message sent to ${selectedRecipients.length} recipient(s)`,
                `ส่งข้อความถึง ${selectedRecipients.length} คน`
            );

            // Auto-redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                onComplete();
            }, 1500);
        } catch {
            toast.error(
                "Failed to send message",
                "ส่งข้อความล้มเหลว"
            );
            setCurrentStep("compose");
            setIsSending(false);
        }
    };

    const canProceed = () => {
        if (currentStep === "recipients") return selectedRecipients.length > 0;
        if (currentStep === "compose") {
            return message.trim() || messageTh.trim();
        }
        return false;
    };

    const getStepTitle = () => {
        switch (currentStep) {
            case "recipients": return t("Select Recipients", "เลือกผู้รับ");
            case "compose": return t("Compose Message", "เขียนข้อความ");
            case "sending": return t("Sending...", "กำลังส่ง...");
            default: return "";
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case "recipients":
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Select one or more teachers to message", "เลือกครูที่ต้องการส่งข้อความ")}
                        </p>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {availableRecipients?.map(user => (
                                <div
                                    key={user._id}
                                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedRecipients.includes(user._id)}
                                        onChange={() => toggleRecipient(user._id)}
                                        className="w-5 h-5"
                                    />
                                    <div className="flex-1">
                                        <p className="font-medium">{user.username}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {user.role} {user.schoolId && `• School`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                {t(
                                    `Selected: ${selectedRecipients.length} recipient(s)`,
                                    `เลือกแล้ว: ${selectedRecipients.length} คน`
                                )}
                            </p>
                        </div>
                    </div>
                );

            case "compose":
                return (
                    <div className="space-y-4">
                        <p className="text-gray-600 dark:text-gray-400">
                            {t("Write your message (provide at least one language)", "เขียนข้อความของคุณ (กรอกอย่างน้อยหนึ่งภาษา)")}
                        </p>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t("Message (English)", "ข้อความ (ภาษาอังกฤษ)")}
                            </label>
                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                                placeholder="Your message in English"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t("Message (Thai)", "ข้อความ (ภาษาไทย)")}
                            </label>
                            <textarea
                                value={messageTh}
                                onChange={(e) => setMessageTh(e.target.value)}
                                rows={8}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                                placeholder="ข้อความภาษาไทย"
                            />
                        </div>
                    </div>
                );

            case "sending":
                return (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                            {t("Sending messages...", "กำลังส่งข้อความ...")}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            {t("Status: Pending → Sent", "สถานะ: รอดำเนินการ → ส่งแล้ว")}
                        </p>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-4 md:p-6 border-b bg-white dark:bg-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Send className="w-6 h-6 text-pink-600" />
                        <div>
                            <h2 className="text-xl font-bold">{t("Message Teacher/User", "ส่งข้อความถึงครู/ผู้ใช้")}</h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{getStepTitle()}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSending}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-grow p-4 md:p-6">
                    {renderStepContent()}
                </div>

                {/* Footer */}
                <div className="p-4 md:p-6 border-t bg-white dark:bg-gray-800 flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={currentStep === "recipients" || isSending}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        {t("Back", "ย้อนกลับ")}
                    </button>
                    {currentStep === "recipients" && (
                        <button
                            onClick={handleNext}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t("Next", "ถัดไป")}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    )}
                    {currentStep === "compose" && (
                        <button
                            onClick={handleSend}
                            disabled={!canProceed() || isSending}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-5 h-5" />
                            {t("Send", "ส่ง")}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
