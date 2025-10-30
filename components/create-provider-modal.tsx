"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { Building2, X } from "lucide-react";
import { useState } from "react";
import { BilingualInput } from "./bilingual-input";

interface CreateProviderModalProps {
    userId: Id<"users">;
    onClose: () => void;
    onCreated: (providerId: Id<"providers">) => void;
}

export function CreateProviderModal({ userId, onClose, onCreated }: CreateProviderModalProps) {
    const { t, language } = useLanguage();
    const createProvider = useMutation(api.providers.create);

    const [name, setName] = useState("");
    const [nameTh, setNameTh] = useState("");
    const [category, setCategory] = useState<"personal" | "private" | "language_school" | "educational_camp">("personal");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name.trim() && !nameTh.trim()) {
            toast.error(
                "Please provide provider name in at least one language",
                "กรุณากรอกชื่อผู้ให้บริการในอย่างน้อยหนึ่งภาษา"
            );
            return;
        }

        setIsSubmitting(true);

        try {
            const providerId = await createProvider({
                name: name.trim() || nameTh.trim(),
                nameTh: nameTh.trim() || name.trim(),
                category,
                createdBy: userId,
            });

            toast.success(
                "Provider created successfully!",
                "สร้างผู้ให้บริการสำเร็จ!"
            );

            onCreated(providerId);
            onClose();
        } catch (error) {
            console.error("Error creating provider:", error);
            toast.error(
                "Failed to create provider",
                "สร้างผู้ให้บริการไม่สำเร็จ",
                "Error",
                "ข้อผิดพลาด",
                {
                    errorOrigin: "create-provider-modal.tsx",
                    errorFunction: "handleSubmit",
                    userAction: "Attempted to create provider",
                    stackTrace: error instanceof Error ? error.stack : String(error),
                }
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full flex flex-col max-h-[85vh] shadow-2xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Building2 className="w-6 h-6 text-white" />
                            <h2 className="text-2xl font-bold text-white">
                                {t("Create New Provider", "สร้างผู้ให้บริการใหม่")}
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                            aria-label={t("Close", "ปิด")}
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="overflow-y-auto flex-grow p-4 md:p-6 space-y-6">
                    {/* Provider Category */}
                    <div className="space-y-2">
                        <label className="block font-medium text-gray-900 dark:text-gray-100">
                            {t("Provider Category", "ประเภทผู้ให้บริการ")} <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value as typeof category)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500"
                            required
                        >
                            <option value="personal">
                                {t("Personal - Private tutoring students", "ส่วนตัว - นักเรียนกวดวิชาส่วนตัว")}
                            </option>
                            <option value="private">
                                {t("Private - Private tutoring company", "เอกชน - บริษัทกวดวิชาเอกชน")}
                            </option>
                            <option value="language_school">
                                {t("Language School - Language learning centers", "โรงเรียนภาษา - ศูนย์เรียนภาษา")}
                            </option>
                            <option value="educational_camp">
                                {t("Educational Camp - Workshops/summer camps", "ค่ายการศึกษา - เวิร์กช็อป/ค่ายฤดูร้อน")}
                            </option>
                        </select>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {category === "personal" && t(
                                "For your own private tutoring students",
                                "สำหรับนักเรียนกวดวิชาส่วนตัวของคุณเอง"
                            )}
                            {category === "private" && t(
                                "For private tutoring companies you work with",
                                "สำหรับบริษัทกวดวิชาเอกชนที่คุณทำงานด้วย"
                            )}
                            {category === "language_school" && t(
                                "For language schools like British Council, Wall Street English",
                                "สำหรับโรงเรียนภาษาเช่น British Council, Wall Street English"
                            )}
                            {category === "educational_camp" && t(
                                "For workshops, summer camps, or special programs",
                                "สำหรับเวิร์กช็อป ค่ายฤดูร้อน หรือโปรแกรมพิเศษ"
                            )}
                        </p>
                    </div>

                    {/* Provider Name (Bilingual) */}
                    <BilingualInput
                        labelEn="Provider Name"
                        labelTh="ชื่อผู้ให้บริการ"
                        valueEn={name}
                        valueTh={nameTh}
                        onChangeEn={setName}
                        onChangeTh={setNameTh}
                        type="text"
                        required={false}
                        placeholder="e.g., British Council, Happy Summer Camp"
                        placeholderTh="เช่น บริติช เคานซิล, แฮปปี้ซัมเมอร์แคมป์"
                    />

                    {/* Info Box */}
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <p className="text-sm text-purple-900 dark:text-purple-100">
                            <strong>{t("Note:", "หมายเหตุ:")}</strong>{" "}
                            {t(
                                "Providers are used to organize classes outside of traditional schools. You can create multiple providers for different contexts.",
                                "ผู้ให้บริการใช้สำหรับจัดระเบียบชั้นเรียนนอกโรงเรียนแบบดั้งเดิม คุณสามารถสร้างผู้ให้บริการหลายรายสำหรับบริบทที่แตกต่างกัน"
                            )}
                        </p>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-600 flex gap-3">
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting
                            ? t("Creating...", "กำลังสร้าง...")
                            : t("Create Provider", "สร้างผู้ให้บริการ")}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {t("Cancel", "ยกเลิก")}
                    </button>
                </div>
            </div>
        </div>
    );
}
