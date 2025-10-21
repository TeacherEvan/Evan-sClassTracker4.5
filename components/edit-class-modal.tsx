"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Calendar, Edit3, MapPin, User, X } from "lucide-react";
import { useEffect, useState } from "react";

interface EditClassModalProps {
    classData: Doc<"classes">;
    currentUserId: Id<"users">;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditClassModal({
    classData,
    currentUserId,
    onClose,
    onSuccess,
}: EditClassModalProps) {
    const { t } = useLanguage();
    const students = useQuery(api.students.list, {});
    const locations = useQuery(
        api.locations.list,
        classData.schoolId ? { schoolId: classData.schoolId, activeOnly: true } : "skip"
    );
    const editClass = useMutation(api.classes.editClass);

    // Form state
    const [studentId, setStudentId] = useState<Id<"students">>(classData.studentId);
    const [locationId, setLocationId] = useState<Id<"locations"> | "">(classData.locationId || "");
    const [scheduledDate, setScheduledDate] = useState(
        new Date(classData.scheduledDate).toISOString().slice(0, 16)
    );
    const [duration, setDuration] = useState(classData.duration?.toString() || "60");
    const [subject, setSubject] = useState(classData.subject || "");
    const [subjectTh, setSubjectTh] = useState(classData.subjectTh || "");
    const [lessonTopic, setLessonTopic] = useState(classData.lessonTopic || "");
    const [lessonTopicTh, setLessonTopicTh] = useState(classData.lessonTopicTh || "");
    const [materials, setMaterials] = useState(classData.materials || "");
    const [materialsTh, setMaterialsTh] = useState(classData.materialsTh || "");
    const [preparationNotes, setPreparationNotes] = useState(classData.preparationNotes || "");
    const [preparationNotesTh, setPreparationNotesTh] = useState(classData.preparationNotesTh || "");
    const [classType, setClassType] = useState<"regular" | "makeup" | "assessment" | "trial" | "">(
        classData.classType || ""
    );

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showOptional, setShowOptional] = useState(false);

    // Show optional section if any optional fields have values
    useEffect(() => {
        if (subject || lessonTopic || materials || preparationNotes || classType) {
            setShowOptional(true);
        }
    }, [subject, lessonTopic, materials, preparationNotes, classType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const scheduledTimestamp = new Date(scheduledDate).getTime();

            await editClass({
                userId: currentUserId,
                classId: classData._id,
                updates: {
                    studentId,
                    locationId: locationId || undefined,
                    scheduledDate: scheduledTimestamp,
                    duration: duration ? Number.parseInt(duration) : undefined,
                    subject: subject || undefined,
                    subjectTh: subjectTh || undefined,
                    lessonTopic: lessonTopic || undefined,
                    lessonTopicTh: lessonTopicTh || undefined,
                    materials: materials || undefined,
                    materialsTh: materialsTh || undefined,
                    preparationNotes: preparationNotes || undefined,
                    preparationNotesTh: preparationNotesTh || undefined,
                    classType: classType || undefined,
                },
            });

            onSuccess();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update class");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Edit3 className="w-6 h-6 text-blue-600" />
                            {t("Edit Class", "แก้ไขคลาส")}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Required Fields */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            {t("Required Information", "ข้อมูลที่จำเป็น")}
                        </h3>

                        {/* Student */}
                        <div>
                            <label className="flex text-sm font-medium mb-2 items-center gap-2">
                                <User className="w-4 h-4" />
                                {t("Student", "นักเรียน")}
                            </label>
                            <select
                                value={studentId}
                                onChange={(e) => setStudentId(e.target.value as Id<"students">)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                required
                            >
                                {students?.map((student) => (
                                    <option key={student._id} value={student._id}>
                                        {student.firstName} {student.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="flex text-sm font-medium mb-2 items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                {t("Location", "สถานที่")}
                            </label>
                            <select
                                value={locationId}
                                onChange={(e) => setLocationId(e.target.value as Id<"locations"> | "")}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                required
                            >
                                <option value="">{t("Select location", "เลือกสถานที่")}</option>
                                {locations?.map((location) => (
                                    <option key={location._id} value={location._id}>
                                        {location.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Date & Time */}
                        <div>
                            <label className="flex text-sm font-medium mb-2 items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {t("Date & Time", "วันที่และเวลา")}
                            </label>
                            <input
                                type="datetime-local"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                required
                            />
                        </div>

                        {/* Duration */}
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                {t("Duration (minutes)", "ระยะเวลา (นาที)")}
                            </label>
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                min="15"
                                step="15"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                placeholder="60"
                            />
                        </div>
                    </div>

                    {/* Optional Fields Toggle */}
                    <div>
                        <button
                            type="button"
                            onClick={() => setShowOptional(!showOptional)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium flex items-center gap-2"
                        >
                            {showOptional ? "▼" : "▶"} {t("Optional Information", "ข้อมูลเพิ่มเติม (ไม่บังคับ)")}
                        </button>
                    </div>

                    {/* Optional Fields */}
                    {showOptional && (
                        <div className="space-y-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {/* Class Type */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    {t("Class Type", "ประเภทคลาส")}
                                </label>
                                <select
                                    value={classType}
                                    onChange={(e) => setClassType(e.target.value as typeof classType)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                >
                                    <option value="">{t("Not specified", "ไม่ระบุ")}</option>
                                    <option value="regular">{t("Regular", "ปกติ")}</option>
                                    <option value="makeup">{t("Make-up", "ชดเชย")}</option>
                                    <option value="assessment">{t("Assessment", "ประเมินผล")}</option>
                                    <option value="trial">{t("Trial", "ทดลอง")}</option>
                                </select>
                            </div>

                            {/* Subject */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Subject (English)", "วิชา (ภาษาอังกฤษ)")}
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                        placeholder="Math, English, etc."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Subject (Thai)", "วิชา (ภาษาไทย)")}
                                    </label>
                                    <input
                                        type="text"
                                        value={subjectTh}
                                        onChange={(e) => setSubjectTh(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                        placeholder="คณิตศาสตร์, ภาษาอังกฤษ, ฯลฯ"
                                    />
                                </div>
                            </div>

                            {/* Lesson Topic */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Lesson Topic (English)", "หัวข้อบทเรียน (ภาษาอังกฤษ)")}
                                    </label>
                                    <input
                                        type="text"
                                        value={lessonTopic}
                                        onChange={(e) => setLessonTopic(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Lesson Topic (Thai)", "หัวข้อบทเรียน (ภาษาไทย)")}
                                    </label>
                                    <input
                                        type="text"
                                        value={lessonTopicTh}
                                        onChange={(e) => setLessonTopicTh(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                    />
                                </div>
                            </div>

                            {/* Materials */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Materials (English)", "อุปกรณ์ (ภาษาอังกฤษ)")}
                                    </label>
                                    <textarea
                                        value={materials}
                                        onChange={(e) => setMaterials(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Materials (Thai)", "อุปกรณ์ (ภาษาไทย)")}
                                    </label>
                                    <textarea
                                        value={materialsTh}
                                        onChange={(e) => setMaterialsTh(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                    />
                                </div>
                            </div>

                            {/* Preparation Notes */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Preparation Notes (English)", "บันทึกเตรียมการ (ภาษาอังกฤษ)")}
                                    </label>
                                    <textarea
                                        value={preparationNotes}
                                        onChange={(e) => setPreparationNotes(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        {t("Preparation Notes (Thai)", "บันทึกเตรียมการ (ภาษาไทย)")}
                                    </label>
                                    <textarea
                                        value={preparationNotesTh}
                                        onChange={(e) => setPreparationNotesTh(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 font-medium"
                        >
                            {t("Cancel", "ยกเลิก")}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                        >
                            {loading ? t("Saving Changes...", "กำลังบันทึกการเปลี่ยนแปลง...") : t("Save Changes", "บันทึกการเปลี่ยนแปลง")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
