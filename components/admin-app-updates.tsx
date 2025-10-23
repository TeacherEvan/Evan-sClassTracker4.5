"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import {
    Calendar,
    CheckCircle2,
    Edit3,
    FileText,
    Plus,
    Power,
    Sparkles,
    Trash2,
} from "lucide-react";
import { useState } from "react";

interface AdminAppUpdatesProps {
    currentUserId: Id<"users">;
}

// Icon options for features
const iconOptions = [
    { value: "CheckCircle2", label: "Check Circle", Icon: CheckCircle2 },
    { value: "Edit3", label: "Edit", Icon: Edit3 },
    { value: "FileText", label: "File", Icon: FileText },
    { value: "Calendar", label: "Calendar", Icon: Calendar },
    { value: "Sparkles", label: "Sparkles", Icon: Sparkles },
];

export function AdminAppUpdates({ currentUserId }: AdminAppUpdatesProps) {
    const { t, language } = useLanguage();
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Form state
    const [version, setVersion] = useState("");
    const [title, setTitle] = useState("");
    const [titleTh, setTitleTh] = useState("");
    const [description, setDescription] = useState("");
    const [descriptionTh, setDescriptionTh] = useState("");
    const [features, setFeatures] = useState<{
        title: string;
        titleTh: string;
        description: string;
        descriptionTh: string;
        icon: string;
    }[]>([]);

    const updates = useQuery(api.appUpdates.list, { userId: currentUserId });
    const createUpdate = useMutation(api.appUpdates.create);
    const toggleActive = useMutation(api.appUpdates.toggleActive);

    const resetForm = () => {
        setVersion("");
        setTitle("");
        setTitleTh("");
        setDescription("");
        setDescriptionTh("");
        setFeatures([]);
        setShowCreateModal(false);
    };

    const addFeature = () => {
        setFeatures([
            ...features,
            {
                title: "",
                titleTh: "",
                description: "",
                descriptionTh: "",
                icon: "CheckCircle2",
            },
        ]);
    };

    const removeFeature = (index: number) => {
        setFeatures(features.filter((_, i) => i !== index));
    };

    const updateFeature = (
        index: number,
        field: string,
        value: string
    ) => {
        const newFeatures = [...features];
        newFeatures[index] = { ...newFeatures[index], [field]: value };
        setFeatures(newFeatures);
    };

    const handleCreate = async () => {
        if (!version || !title || !titleTh || !description || !descriptionTh) {
            toast.error(
                "Please fill in all required fields",
                "กรุณากรอกข้อมูลที่จำเป็นทั้งหมด"
            );
            return;
        }

        if (features.length === 0) {
            toast.error(
                "Please add at least one feature",
                "กรุณาเพิ่มฟีเจอร์อย่างน้อยหนึ่งรายการ"
            );
            return;
        }

        // Validate all features are complete
        const invalidFeature = features.find(
            (f) => !f.title || !f.titleTh || !f.description || !f.descriptionTh
        );
        if (invalidFeature) {
            toast.error(
                "All features must have complete English and Thai content",
                "ฟีเจอร์ทั้งหมดต้องมีข้อมูลภาษาอังกฤษและไทยครบถ้วน"
            );
            return;
        }

        try {
            await createUpdate({
                userId: currentUserId,
                version,
                title,
                titleTh,
                description,
                descriptionTh,
                features,
            });
            toast.success(
                "App update created successfully!",
                "สร้างประกาศอัปเดตเรียบร้อยแล้ว!"
            );
            resetForm();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to create update",
                "ไม่สามารถสร้างประกาศได้"
            );
        }
    };

    const handleToggleActive = async (updateId: Id<"appUpdates">) => {
        try {
            await toggleActive({
                userId: currentUserId,
                updateId,
            });
            toast.success(
                "Update status changed",
                "เปลี่ยนสถานะเรียบร้อยแล้ว"
            );
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : "Failed to toggle status",
                "ไม่สามารถเปลี่ยนสถานะได้"
            );
        }
    };

    const loadQuickTemplate = () => {
        setVersion("4.5.1");
        setTitle("Faster, Simpler Class Booking");
        setTitleTh("จองคลาสง่ายและเร็วขึ้น");
        setDescription(
            "We've streamlined the booking process to save you time and reduce confusion. Everything is now clearer and more organized."
        );
        setDescriptionTh(
            "เราได้ปรับปรุงระบบการจองให้ง่ายขึ้น ประหยัดเวลา และลดความสับสน ทุกอย่างชัดเจนและเป็นระเบียบมากขึ้น"
        );
        setFeatures([
            {
                icon: "CheckCircle2",
                title: "Improved Student Name Entry",
                titleTh: "ป้อนชื่อนักเรียนง่ายขึ้น",
                description:
                    "Now you only need to enter the student's nickname - no more long forms to fill out",
                descriptionTh:
                    "ตอนนี้คุณต้องกรอกแค่ชื่อเล่นของนักเรียน - ไม่ต้องกรอกฟอร์มยาวๆ อีกต่อไป",
            },
            {
                icon: "Edit3",
                title: "Clearer Grade & Class Selection",
                titleTh: "เลือกเกรดและห้องเรียนชัดเจนขึ้น",
                description:
                    "Reorganized dropdowns make it faster to select student grade (K1-K3) and class (/1-/10)",
                descriptionTh:
                    "เมนูดร็อปดาวน์ใหม่ช่วยให้เลือกเกรด (อนุบาล 1-3) และห้อง (/1-/10) ได้เร็วขึ้น",
            },
            {
                icon: "FileText",
                title: "Teacher Activity Logs in Analytics",
                titleTh: "บันทึกกิจกรรมครูในแท็บวิเคราะห์",
                description:
                    "Access all your teaching logs and exports right from the Analytics tab",
                descriptionTh:
                    "เข้าถึงบันทึกการสอนและส่งออกข้อมูลได้จากแท็บวิเคราะห์",
            },
            {
                icon: "Sparkles",
                title: "Better Confirmation Dialogs",
                titleTh: "หน้าต่างยืนยันที่ดีขึ้น",
                description:
                    "Important actions now show clear, easy-to-read confirmation windows instead of browser popups",
                descriptionTh:
                    "การดำเนินการสำคัญแสดงหน้าต่างยืนยันที่อ่านง่ายแทนป๊อปอัปของเบราว์เซอร์",
            },
        ]);
    };

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                    <Sparkles className="w-7 h-7 text-purple-600" />
                    {t("App Updates", "ประกาศอัปเดต")}
                </h1>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    {t("Create Update", "สร้างประกาศ")}
                </button>
            </div>

            {/* Updates List */}
            <div className="space-y-4">
                {updates === undefined ? (
                    <div className="text-center py-8 text-gray-500">
                        {t("Loading...", "กำลังโหลด...")}
                    </div>
                ) : updates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        {t(
                            "No app updates yet. Create your first one!",
                            "ยังไม่มีประกาศอัปเดต สร้างประกาศแรกของคุณ!"
                        )}
                    </div>
                ) : (
                    updates.map((update) => (
                        <div
                            key={update._id}
                            className={`p-6 rounded-xl border-2 transition-all ${update.isActive
                                    ? "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-300 dark:border-purple-700"
                                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded">
                                            v{update.version}
                                        </span>
                                        {update.isActive && (
                                            <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded flex items-center gap-1">
                                                <Power className="w-3 h-3" />
                                                {t("Active", "ใช้งาน")}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold">
                                        {language === "th" ? update.titleTh : update.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(update.releaseDate).toLocaleDateString(
                                            language === "th" ? "th-TH" : "en-US"
                                        )}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleToggleActive(update._id)}
                                    className={`p-2 rounded-lg transition-colors ${update.isActive
                                            ? "bg-red-100 hover:bg-red-200 text-red-700"
                                            : "bg-green-100 hover:bg-green-200 text-green-700"
                                        }`}
                                    title={
                                        update.isActive
                                            ? t("Deactivate", "ปิดการใช้งาน")
                                            : t("Activate", "เปิดการใช้งาน")
                                    }
                                >
                                    <Power className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-gray-700 dark:text-gray-300 mb-4">
                                {language === "th" ? update.descriptionTh : update.description}
                            </p>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-gray-600 dark:text-gray-400">
                                    {t("Features:", "ฟีเจอร์:")}
                                </h4>
                                {update.features.map((feature, idx) => {
                                    const IconComponent =
                                        iconOptions.find((opt) => opt.value === feature.icon)
                                            ?.Icon || CheckCircle2;
                                    return (
                                        <div key={idx} className="flex items-start gap-2">
                                            <IconComponent className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-sm">
                                                {language === "th" ? feature.titleTh : feature.title}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                    <Plus className="w-6 h-6" />
                                    {t("Create App Update", "สร้างประกาศอัปเดต")}
                                </h2>
                                <button
                                    onClick={() => loadQuickTemplate()}
                                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors"
                                >
                                    {t("Load Template", "โหลดเทมเพลต")}
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Version */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t("Version", "เวอร์ชัน")} *
                                </label>
                                <input
                                    type="text"
                                    value={version}
                                    onChange={(e) => setVersion(e.target.value)}
                                    placeholder="4.5.1"
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>

                            {/* Title */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Title (English)", "หัวข้อ (ภาษาอังกฤษ)")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="New Features & Improvements"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Title (Thai)", "หัวข้อ (ภาษาไทย)")} *
                                    </label>
                                    <input
                                        type="text"
                                        value={titleTh}
                                        onChange={(e) => setTitleTh(e.target.value)}
                                        placeholder="ฟีเจอร์ใหม่และการปรับปรุง"
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Description (English)", "คำอธิบาย (ภาษาอังกฤษ)")} *
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Brief overview of what changed..."
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Description (Thai)", "คำอธิบาย (ภาษาไทย)")} *
                                    </label>
                                    <textarea
                                        value={descriptionTh}
                                        onChange={(e) => setDescriptionTh(e.target.value)}
                                        placeholder="สรุปสิ่งที่เปลี่ยนแปลง..."
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold">
                                        {t("Features", "ฟีเจอร์")} *
                                    </h3>
                                    <button
                                        onClick={addFeature}
                                        className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t("Add Feature", "เพิ่มฟีเจอร์")}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {features.map((feature, idx) => (
                                        <div
                                            key={idx}
                                            className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg space-y-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                                    {t("Feature", "ฟีเจอร์")} {idx + 1}
                                                </span>
                                                <button
                                                    onClick={() => removeFeature(idx)}
                                                    className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Icon Selection */}
                                            <div>
                                                <label className="block text-xs font-medium mb-1">
                                                    {t("Icon", "ไอคอน")}
                                                </label>
                                                <select
                                                    value={feature.icon}
                                                    onChange={(e) =>
                                                        updateFeature(idx, "icon", e.target.value)
                                                    }
                                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                                >
                                                    {iconOptions.map((opt) => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Titles */}
                                            <div className="grid md:grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={feature.title}
                                                    onChange={(e) =>
                                                        updateFeature(idx, "title", e.target.value)
                                                    }
                                                    placeholder={t("Title (EN)", "หัวข้อ (EN)")}
                                                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <input
                                                    type="text"
                                                    value={feature.titleTh}
                                                    onChange={(e) =>
                                                        updateFeature(idx, "titleTh", e.target.value)
                                                    }
                                                    placeholder={t("Title (TH)", "หัวข้อ (TH)")}
                                                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>

                                            {/* Descriptions */}
                                            <div className="grid md:grid-cols-2 gap-2">
                                                <textarea
                                                    value={feature.description}
                                                    onChange={(e) =>
                                                        updateFeature(idx, "description", e.target.value)
                                                    }
                                                    placeholder={t("Description (EN)", "คำอธิบาย (EN)")}
                                                    rows={2}
                                                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                                <textarea
                                                    value={feature.descriptionTh}
                                                    onChange={(e) =>
                                                        updateFeature(idx, "descriptionTh", e.target.value)
                                                    }
                                                    placeholder={t("Description (TH)", "คำอธิบาย (TH)")}
                                                    rows={2}
                                                    className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:border-gray-600"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    {features.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                                            {t(
                                                "No features added yet. Click 'Add Feature' to start.",
                                                "ยังไม่มีฟีเจอร์ คลิก 'เพิ่มฟีเจอร์' เพื่อเริ่มต้น"
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {t("Cancel", "ยกเลิก")}
                                </button>
                                <button
                                    onClick={handleCreate}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg"
                                >
                                    {t("Create Update", "สร้างประกาศ")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
