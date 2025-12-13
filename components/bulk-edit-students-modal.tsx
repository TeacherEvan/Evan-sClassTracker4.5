"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Save, X } from "lucide-react";
import { useState } from "react";

interface BulkEditStudentsModalProps {
    selectedStudentIds: Id<"students">[];
    currentUserId: Id<"users">;
    onClose: () => void;
    onSuccess: () => void;
}

export function BulkEditStudentsModal({
    selectedStudentIds,
    currentUserId,
    onClose,
    onSuccess,
}: BulkEditStudentsModalProps) {
    const { t, language } = useLanguage();
    const bulkUpdateStudents = useMutation(api.bulkOperations.bulkUpdateStudents);
    const schools = useQuery(api.schools.list, {});
    const myProviders = useQuery(api.providers.list, { userId: currentUserId });

    // Field enable/disable state
    const [updateNickname, setUpdateNickname] = useState(false);
    const [updateGrade, setUpdateGrade] = useState(false);
    const [updateClass, setUpdateClass] = useState(false);
    const [updateSchool, setUpdateSchool] = useState(false);
    const [updateProvider, setUpdateProvider] = useState(false);
    const [updateParentName, setUpdateGuardianName] = useState(false);
    const [updateParentPhone, setUpdateGuardianPhone] = useState(false);
    const [updateParentEmail, setUpdateGuardianEmail] = useState(false);
    const [updateParentName, setUpdateParentName] = useState(false);
    const [updateParentPhone, setUpdateParentPhone] = useState(false);
    const [updateParentEmail, setUpdateParentEmail] = useState(false);
    const [updateAllergies, setUpdateAllergies] = useState(false);
    const [updateSpecialNeeds, setUpdateSpecialNeeds] = useState(false);
    const [updateMedicalNotes, setUpdateMedicalNotes] = useState(false);
    const [updateNotes, setUpdateNotes] = useState(false);

    // Field values
    const [nickname, setNickname] = useState("");
    const [grade, setGrade] = useState("");
    const [studentClass, setStudentClass] = useState("");
    const [schoolId, setSchoolId] = useState<Id<"schools"> | "">("");
    const [providerId, setProviderId] = useState<Id<"providers"> | "">("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [parentName, setParentName] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [allergies, setAllergies] = useState("");
    const [specialNeeds, setSpecialNeeds] = useState("");
    const [medicalNotes, setMedicalNotes] = useState("");
    const [notes, setNotes] = useState("");
    const [reason, setReason] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const grades = ["K1", "K2", "K3", "P1", "P2", "P3", "P4", "P5", "P6", "M1", "M2", "M3", "M4", "M5", "M6"];
    const classes = ["/1", "/2", "/3", "/4", "/5", "/6", "/7", "/8", "/9", "/10"];

    const handleSubmit = async () => {
        setError("");

        // Validate reason
        if (!reason.trim()) {
            setError(t("Please provide a reason for this bulk update", "กรุณาระบุเหตุผลสำหรับการอัปเดตแบบกลุ่ม"));
            return;
        }

        // Build updates object with only enabled fields
        const updates: Record<string, string | undefined | null> = {};

        if (updateNickname) updates.nickname = nickname;
        if (updateGrade) updates.grade = grade;
        if (updateClass) updates.class = studentClass;
        if (updateSchool && schoolId) updates.schoolId = schoolId;
        if (updateProvider && providerId) updates.providerId = providerId;
        if (updateParentName) updates.parentName = parentName;
        if (updateParentPhone) updates.parentPhone = parentPhone;
        if (updateParentEmail) updates.parentEmail = parentEmail;
        if (updateParentName) updates.parentName = parentName;
        if (updateParentPhone) updates.parentPhone = parentPhone;
        if (updateParentEmail) updates.parentEmail = parentEmail;
        if (updateAllergies) updates.allergies = allergies;
        if (updateSpecialNeeds) updates.specialNeeds = specialNeeds;
        if (updateMedicalNotes) updates.medicalNotes = medicalNotes;
        if (updateNotes) updates.notes = notes;

        // Validate at least one field is selected
        if (Object.keys(updates).length === 0) {
            setError(t("Please select at least one field to update", "กรุณาเลือกอย่างน้อยหนึ่งฟิลด์เพื่ออัปเดต"));
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await bulkUpdateStudents({
                studentIds: selectedStudentIds,
                userId: currentUserId,
                updates,
                reason: reason.trim(),
            });

            if (result.successful > 0) {
                const failedMsgEn = result.failed > 0 ? ` (${result.failed} failed)` : "";
                const failedMsgTh = result.failed > 0 ? ` (${result.failed} ล้มเหลว)` : "";

                toast.success(
                    `Successfully updated ${result.successful} students${failedMsgEn}`,
                    `อัปเดตสำเร็จ ${result.successful} นักเรียน${failedMsgTh}`
                );
            }

            if (result.failed > 0) {
                const errorMessages = result.errors.map((e: { studentName: string; error: string }) => `${e.studentName}: ${e.error}`).join("\n");
                toast.error(
                    t("Some updates failed", "การอัปเดตบางรายการล้มเหลว"),
                    errorMessages.substring(0, 200)
                );
            }

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update students");
        } finally {
            setIsSubmitting(false);
        }
    };

    const enabledFieldsCount = [
        updateNickname,
        updateGrade,
        updateClass,
        updateSchool,
        updateProvider,
        updateParentName,
        updateParentPhone,
        updateParentEmail,
        updateParentName,
        updateParentPhone,
        updateParentEmail,
        updateAllergies,
        updateSpecialNeeds,
        updateMedicalNotes,
        updateNotes,
    ].filter(Boolean).length;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-4xl w-full flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                                {t("Bulk Edit Students", "แก้ไขนักเรียนแบบกลุ่ม")}
                            </h2>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {t(`${selectedStudentIds.length} students selected`, `เลือก ${selectedStudentIds.length} นักเรียน`)}
                                {enabledFieldsCount > 0 && (
                                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                                        • {t(`${enabledFieldsCount} fields enabled`, `เปิดใช้งาน ${enabledFieldsCount} ฟิลด์`)}
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            aria-label={t("Close", "ปิด")}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content - Scrollable */}
                <div className="overflow-y-auto grow p-4 md:p-6 space-y-4 md:space-y-6">
                    {/* Warning */}
                    <div className="rounded-lg border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                <p className="font-semibold mb-1">
                                    {t("Important: Selective Field Updates", "สำคัญ: การอัปเดตฟิลด์แบบเลือก")}
                                </p>
                                <p>
                                    {t(
                                        "Only checked fields will be updated. Unchecked fields will remain unchanged. Student names (First/Last) cannot be edited in bulk.",
                                        "จะมีการอัปเดตเฉพาะฟิลด์ที่เลือกเท่านั้น ฟิลด์ที่ไม่ได้เลือกจะไม่เปลี่ยนแปลง ไม่สามารถแก้ไขชื่อนักเรียน (ชื่อ/นามสกุล) แบบกลุ่มได้"
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reason (Required) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t("Reason for Update", "เหตุผลในการอัปเดต")} <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={t("E.g., Correcting grade levels after promotion", "เช่น แก้ไขระดับชั้นหลังจากเลื่อนชั้น")}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows={2}
                            required
                        />
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("Basic Information", "ข้อมูลพื้นฐาน")}
                        </h3>

                        {/* Nickname */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-nickname"
                                checked={updateNickname}
                                onChange={(e) => setUpdateNickname(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Nickname", "ชื่อเล่น")}
                                </label>
                                <input
                                    type="text"
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    disabled={!updateNickname}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Grade */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-grade"
                                checked={updateGrade}
                                onChange={(e) => setUpdateGrade(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Grade", "ชั้น")}
                                </label>
                                <select
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    disabled={!updateGrade}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">{t("Select grade", "เลือกชั้น")}</option>
                                    {grades.map((g) => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Class */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-class"
                                checked={updateClass}
                                onChange={(e) => setUpdateClass(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-class" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Class", "ห้อง")}
                                </label>
                                <select
                                    value={studentClass}
                                    onChange={(e) => setStudentClass(e.target.value)}
                                    disabled={!updateClass}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">{t("Select class", "เลือกห้อง")}</option>
                                    {classes.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* School/Provider */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("School / Provider", "โรงเรียน / ผู้ให้บริการ")}
                        </h3>

                        {/* School */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-school"
                                checked={updateSchool}
                                onChange={(e) => {
                                    setUpdateSchool(e.target.checked);
                                    if (e.target.checked) setUpdateProvider(false);
                                }}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-school" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("School", "โรงเรียน")}
                                </label>
                                <select
                                    value={schoolId}
                                    onChange={(e) => setSchoolId(e.target.value as Id<"schools">)}
                                    disabled={!updateSchool}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">{t("Select school", "เลือกโรงเรียน")}</option>
                                    {schools?.map((school) => (
                                        <option key={school._id} value={school._id}>
                                            {language === "en" ? school.name : school.nameTh}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Provider */}
                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-provider"
                                checked={updateProvider}
                                onChange={(e) => {
                                    setUpdateProvider(e.target.checked);
                                    if (e.target.checked) setUpdateSchool(false);
                                }}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-provider" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Provider", "ผู้ให้บริการ")}
                                </label>
                                <select
                                    value={providerId}
                                    onChange={(e) => setProviderId(e.target.value as Id<"providers">)}
                                    disabled={!updateProvider}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="">{t("Select provider", "เลือกผู้ให้บริการ")}</option>
                                    {myProviders?.map((provider) => (
                                        <option key={provider._id} value={provider._id}>
                                            {provider.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Guardian Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("Guardian Information", "ข้อมูลผู้ปกครอง")}
                        </h3>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-parent-name"
                                checked={updateParentName}
                                onChange={(e) => setUpdateGuardianName(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-parent-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Parent Name", "ชื่อผู้ปกครอง")}
                                </label>
                                <input
                                    type="text"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                    disabled={!updateParentName}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-parent-phone"
                                checked={updateParentPhone}
                                onChange={(e) => setUpdateGuardianPhone(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-parent-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Parent Phone", "เบอร์ผู้ปกครอง")}
                                </label>
                                <input
                                    type="tel"
                                    value={parentPhone}
                                    onChange={(e) => setParentPhone(e.target.value)}
                                    disabled={!updateParentPhone}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-parent-email"
                                checked={updateParentEmail}
                                onChange={(e) => setUpdateGuardianEmail(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-parent-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Parent Email", "อีเมลผู้ปกครอง")}
                                </label>
                                <input
                                    type="email"
                                    value={parentEmail}
                                    onChange={(e) => setParentEmail(e.target.value)}
                                    disabled={!updateParentEmail}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Parent Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("Parent Information (Primary)", "ข้อมูลผู้ปกครอง (หลัก)")}
                        </h3>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-parent-name"
                                checked={updateParentName}
                                onChange={(e) => setUpdateParentName(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-parent-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Parent Name", "ชื่อผู้ปกครอง")}
                                </label>
                                <input
                                    type="text"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                    disabled={!updateParentName}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-parent-phone"
                                checked={updateParentPhone}
                                onChange={(e) => setUpdateParentPhone(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-parent-phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Parent Phone", "เบอร์ผู้ปกครอง")}
                                </label>
                                <input
                                    type="tel"
                                    value={parentPhone}
                                    onChange={(e) => setParentPhone(e.target.value)}
                                    disabled={!updateParentPhone}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-parent-email"
                                checked={updateParentEmail}
                                onChange={(e) => setUpdateParentEmail(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-parent-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Parent Email", "อีเมลผู้ปกครอง")}
                                </label>
                                <input
                                    type="email"
                                    value={parentEmail}
                                    onChange={(e) => setParentEmail(e.target.value)}
                                    disabled={!updateParentEmail}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Medical Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("Medical Information", "ข้อมูลทางการแพทย์")}
                        </h3>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-allergies"
                                checked={updateAllergies}
                                onChange={(e) => setUpdateAllergies(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-allergies" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Allergies", "อาการแพ้")}
                                </label>
                                <textarea
                                    value={allergies}
                                    onChange={(e) => setAllergies(e.target.value)}
                                    disabled={!updateAllergies}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-special-needs"
                                checked={updateSpecialNeeds}
                                onChange={(e) => setUpdateSpecialNeeds(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-special-needs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Special Needs", "ความต้องการพิเศษ")}
                                </label>
                                <textarea
                                    value={specialNeeds}
                                    onChange={(e) => setSpecialNeeds(e.target.value)}
                                    disabled={!updateSpecialNeeds}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    rows={2}
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-medical-notes"
                                checked={updateMedicalNotes}
                                onChange={(e) => setUpdateMedicalNotes(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-medical-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Medical Notes", "บันทึกทางการแพทย์")}
                                </label>
                                <textarea
                                    value={medicalNotes}
                                    onChange={(e) => setMedicalNotes(e.target.value)}
                                    disabled={!updateMedicalNotes}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("Additional Notes", "บันทึกเพิ่มเติม")}
                        </h3>

                        <div className="flex items-start gap-3">
                            <input
                                type="checkbox"
                                id="update-notes"
                                checked={updateNotes}
                                onChange={(e) => setUpdateNotes(e.target.checked)}
                                className="mt-1"
                            />
                            <div className="grow">
                                <label htmlFor="update-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t("Notes", "บันทึก")}
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    disabled={!updateNotes}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="rounded-lg border border-red-500 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-800 dark:text-red-200">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer - Sticky */}
                <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col sm:flex-row justify-between gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t("Cancel", "ยกเลิก")}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || enabledFieldsCount === 0 || !reason.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                    >
                        <Save className="w-4 h-4" />
                        {isSubmitting
                            ? t("Updating...", "กำลังอัปเดต...")
                            : t(`Update ${selectedStudentIds.length} Students`, `อัปเดต ${selectedStudentIds.length} นักเรียน`)}
                    </button>
                </div>
            </div>
        </div>
    );
}
