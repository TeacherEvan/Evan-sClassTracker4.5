"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useMutation, useQuery } from "convex/react";
import {
    Edit2,
    Eye,
    EyeOff,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Trash2,
    X,
} from "lucide-react";
import { useState } from "react";

interface TeacherHelperAdminProps {
    currentUser: User;
}

interface ResourceForm {
    title: string;
    titleTh: string;
    description: string;
    descriptionTh: string;
    url: string;
    category: string;
    categoryTh: string;
}

const emptyForm: ResourceForm = {
    title: "",
    titleTh: "",
    description: "",
    descriptionTh: "",
    url: "",
    category: "",
    categoryTh: "",
};

export function TeacherHelperAdmin({ currentUser }: TeacherHelperAdminProps) {
    const { t, language } = useLanguage();
    const resources = useQuery(api.teacherResources.listAll);
    const createResource = useMutation(api.teacherResources.create);
    const updateResource = useMutation(api.teacherResources.update);
    const toggleActive = useMutation(api.teacherResources.toggleActive);
    const removeResource = useMutation(api.teacherResources.remove);
    const initializeDefaults = useMutation(api.teacherResources.initializeDefaults);

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<Id<"teacherResources"> | null>(null);
    const [formData, setFormData] = useState<ResourceForm>(emptyForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [resourceToDelete, setResourceToDelete] = useState<Id<"teacherResources"> | null>(null);
    const [showInitModal, setShowInitModal] = useState(false);

    const handleInputChange = (field: keyof ResourceForm, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setError(null);
    };

    const validateForm = (): boolean => {
        if (!formData.title.trim()) {
            setError(t("English title is required", "ต้องระบุชื่อภาษาอังกฤษ"));
            return false;
        }
        if (!formData.titleTh.trim()) {
            setError(t("Thai title is required", "ต้องระบุชื่อภาษาไทย"));
            return false;
        }
        if (!formData.url.trim()) {
            setError(t("URL is required", "ต้องระบุ URL"));
            return false;
        }
        try {
            new URL(formData.url);
        } catch {
            setError(t("Invalid URL format", "รูปแบบ URL ไม่ถูกต้อง"));
            return false;
        }
        if (!formData.category.trim()) {
            setError(t("English category is required", "ต้องระบุหมวดหมู่ภาษาอังกฤษ"));
            return false;
        }
        if (!formData.categoryTh.trim()) {
            setError(t("Thai category is required", "ต้องระบุหมวดหมู่ภาษาไทย"));
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);

        try {
            if (editingId) {
                // Update existing resource
                await updateResource({
                    id: editingId,
                    title: formData.title.trim(),
                    titleTh: formData.titleTh.trim(),
                    description: formData.description.trim(),
                    descriptionTh: formData.descriptionTh.trim(),
                    url: formData.url.trim(),
                    category: formData.category.trim(),
                    categoryTh: formData.categoryTh.trim(),
                    order: resources?.find((r) => r._id === editingId)?.order || 999,
                });
                setEditingId(null);
            } else {
                // Create new resource
                const nextOrder = resources ? resources.length + 1 : 1;
                await createResource({
                    title: formData.title.trim(),
                    titleTh: formData.titleTh.trim(),
                    description: formData.description.trim(),
                    descriptionTh: formData.descriptionTh.trim(),
                    url: formData.url.trim(),
                    category: formData.category.trim(),
                    categoryTh: formData.categoryTh.trim(),
                    order: nextOrder,
                    createdBy: currentUser._id as Id<"users">,
                });
                setIsAdding(false);
            }

            setFormData(emptyForm);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t("An error occurred", "เกิดข้อผิดพลาด")
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (resourceId: Id<"teacherResources">) => {
        const resource = resources?.find((r) => r._id === resourceId);
        if (resource) {
            setFormData({
                title: resource.title,
                titleTh: resource.titleTh,
                description: resource.description,
                descriptionTh: resource.descriptionTh,
                url: resource.url,
                category: resource.category,
                categoryTh: resource.categoryTh,
            });
            setEditingId(resourceId);
            setIsAdding(false);
            setError(null);
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setFormData(emptyForm);
        setError(null);
    };

    const handleToggleActive = async (resourceId: Id<"teacherResources">) => {
        try {
            await toggleActive({ id: resourceId });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t("Failed to toggle status", "ไม่สามารถเปลี่ยนสถานะได้")
            );
        }
    };

    const handleDelete = (resourceId: Id<"teacherResources">) => {
        setResourceToDelete(resourceId);
        setShowDeleteModal(true);
    };

    const executeDelete = async () => {
        if (!resourceToDelete) return;

        try {
            await removeResource({ id: resourceToDelete });
            setShowDeleteModal(false);
            setResourceToDelete(null);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t("Failed to delete resource", "ไม่สามารถลบทรัพยากรได้")
            );
        }
    };

    const handleInitializeDefaults = () => {
        setShowInitModal(true);
    };

    const executeInitialize = async () => {
        setIsInitializing(true);
        try {
            await initializeDefaults({ adminId: currentUser._id as Id<"users"> });
            setShowInitModal(false);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : t("Failed to initialize defaults", "ไม่สามารถเริ่มต้นค่าเริ่มต้นได้")
            );
        } finally {
            setIsInitializing(false);
        }
    };

    if (resources === undefined) {
        return (
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {t("Manage Teacher Resources", "จัดการทรัพยากรสำหรับครู")}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {t(
                            "Add, edit, or remove resources for teachers",
                            "เพิ่ม แก้ไข หรือลบทรัพยากรสำหรับครู"
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    {resources.length === 0 && (
                        <button
                            onClick={handleInitializeDefaults}
                            disabled={isInitializing}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isInitializing ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <RefreshCw className="w-5 h-5" />
                            )}
                            {t("Initialize Defaults", "เริ่มต้นค่าเริ่มต้น")}
                        </button>
                    )}
                    {!isAdding && !editingId && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            {t("Add Resource", "เพิ่มทรัพยากร")}
                        </button>
                    )}
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
            )}

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        {editingId
                            ? t("Edit Resource", "แก้ไขทรัพยากร")
                            : t("Add New Resource", "เพิ่มทรัพยากรใหม่")}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* English Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("Title (English)", "ชื่อ (ภาษาอังกฤษ)")} *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => handleInputChange("title", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Teachers Pay Teachers"
                            />
                        </div>

                        {/* Thai Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("Title (Thai)", "ชื่อ (ภาษาไทย)")} *
                            </label>
                            <input
                                type="text"
                                value={formData.titleTh}
                                onChange={(e) => handleInputChange("titleTh", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="ตลาดทรัพยากรการสอน"
                            />
                        </div>

                        {/* URL */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("URL", "URL")} *
                            </label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => handleInputChange("url", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="https://www.example.com"
                            />
                        </div>

                        {/* English Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("Category (English)", "หมวดหมู่ (ภาษาอังกฤษ)")} *
                            </label>
                            <input
                                type="text"
                                value={formData.category}
                                onChange={(e) => handleInputChange("category", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Worksheets & Games"
                            />
                        </div>

                        {/* Thai Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("Category (Thai)", "หมวดหมู่ (ภาษาไทย)")} *
                            </label>
                            <input
                                type="text"
                                value={formData.categoryTh}
                                onChange={(e) => handleInputChange("categoryTh", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="แบบฝึกหัดและเกม"
                            />
                        </div>

                        {/* English Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("Description (English)", "คำอธิบาย (ภาษาอังกฤษ)")}
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="Brief description of the resource..."
                            />
                        </div>

                        {/* Thai Description */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t("Description (Thai)", "คำอธิบาย (ภาษาไทย)")}
                            </label>
                            <textarea
                                value={formData.descriptionTh}
                                onChange={(e) => handleInputChange("descriptionTh", e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="คำอธิบายสั้นๆ เกี่ยวกับทรัพยากร..."
                            />
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {t("Save", "บันทึก")}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                            {t("Cancel", "ยกเลิก")}
                        </button>
                    </div>
                </div>
            )}

            {/* Resources List */}
            {resources.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        {t(
                            "No resources yet. Click 'Initialize Defaults' to add 5 popular resources, or 'Add Resource' to create your own.",
                            "ยังไม่มีทรัพยากร คลิก 'เริ่มต้นค่าเริ่มต้น' เพื่อเพิ่มทรัพยากรยอดนิยม 5 รายการ หรือ 'เพิ่มทรัพยากร' เพื่อสร้างของคุณเอง"
                        )}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {resources.map((resource) => (
                        <div
                            key={resource._id}
                            className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border ${resource.isActive
                                ? "border-gray-200 dark:border-gray-700"
                                : "border-gray-300 dark:border-gray-600 opacity-60"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Title and Status */}
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                            {language === "en" ? resource.title : resource.titleTh}
                                        </h3>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded-full ${resource.isActive
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                                                }`}
                                        >
                                            {resource.isActive
                                                ? t("Active", "ใช้งาน")
                                                : t("Inactive", "ไม่ใช้งาน")}
                                        </span>
                                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                                            {language === "en" ? resource.category : resource.categoryTh}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {language === "en"
                                            ? resource.description
                                            : resource.descriptionTh}
                                    </p>

                                    {/* URL */}
                                    <a
                                        href={resource.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        {resource.url}
                                    </a>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 ml-4">
                                    <button
                                        onClick={() => handleToggleActive(resource._id)}
                                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title={
                                            resource.isActive
                                                ? t("Deactivate", "ปิดการใช้งาน")
                                                : t("Activate", "เปิดการใช้งาน")
                                        }
                                    >
                                        {resource.isActive ? (
                                            <Eye className="w-5 h-5" />
                                        ) : (
                                            <EyeOff className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(resource._id)}
                                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title={t("Edit", "แก้ไข")}
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(resource._id)}
                                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title={t("Delete", "ลบ")}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {t("Confirm Deletion", "ยืนยันการลบ")}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {t(
                                "Are you sure you want to delete this resource? This action cannot be undone.",
                                "คุณแน่ใจหรือไม่ว่าต้องการลบทรัพยากรนี้? การกระทำนี้ไม่สามารถย้อนกลับได้"
                            )}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={executeDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                {t("Delete", "ลบ")}
                            </button>
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Initialize Defaults Confirmation Modal */}
            {showInitModal && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {t("Initialize Defaults", "เริ่มต้นค่าเริ่มต้น")}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {t(
                                "This will add 5 popular education resources. Do you want to continue?",
                                "นี่จะเพิ่มทรัพยากรการศึกษาที่นิยม 5 รายการ คุณต้องการดำเนินการต่อหรือไม่?"
                            )}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={executeInitialize}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                {t("Yes, Initialize", "ใช่ เริ่มต้น")}
                            </button>
                            <button
                                onClick={() => setShowInitModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                {t("Cancel", "ยกเลิก")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
