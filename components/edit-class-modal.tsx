"use client";

import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation, useQuery } from "convex/react";
import { AlertCircle, Calendar, ChevronDown, ChevronUp, Edit3, MapPin, User, UserPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { MultiDateCalendar } from "./multi-date-calendar";

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
    // Load students filtered by class's school to prevent cross-school contamination
    const students = useQuery(
        api.students.list,
        classData.schoolId ? { schoolId: classData.schoolId } : "skip"
    );
    const locations = useQuery(
        api.locations.list,
        classData.schoolId ? { schoolId: classData.schoolId, activeOnly: true } : "skip"
    );
    const editClass = useMutation(api.classes.editClass);

    // Helper function to convert UTC timestamp to local datetime-local format
    const toLocalDatetimeString = (timestamp: number): string => {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Form state
    const [studentId, setStudentId] = useState<Id<"students">>(classData.studentId);
    const [locationId, setLocationId] = useState<Id<"locations"> | "">(classData.locationId || "");
    const [scheduledDate, setScheduledDate] = useState(
        toLocalDatetimeString(classData.scheduledDate)
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

    // State for adding dates feature
    const [showAddDates, setShowAddDates] = useState(false);
    const [selectedNewDates, setSelectedNewDates] = useState<number[]>([]);
    const [selectedTime, setSelectedTime] = useState("09:00");
    const addDatesToClass = useMutation(api.classes.addDatesToClass);

    // State for adding students feature
    const [showAddStudents, setShowAddStudents] = useState(false);
    const [selectedStudentToAdd, setSelectedStudentToAdd] = useState<Id<"students"> | "">("");
    const [currentAdditionalStudents, setCurrentAdditionalStudents] = useState<Id<"students">[]>(
        classData.additionalStudentIds || []
    );
    const addStudentToClass = useMutation(api.classes.addStudentToClass);
    const removeStudentFromClass = useMutation(api.classes.removeStudentFromClass);

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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh]">
                {/* Header - Sticky */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
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

                {/* Form - Scrollable content */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-grow overflow-hidden">
                    <div className="overflow-y-auto flex-grow p-4 md:p-6 space-y-4 md:space-y-6">
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

                        {/* Add Additional Dates Section */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setShowAddDates(!showAddDates)}
                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium mb-4"
                            >
                                {showAddDates ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                {t("Add More Dates to This Class", "เพิ่มวันเรียนเพิ่มเติม")}
                            </button>

                            {showAddDates && (
                                <div className="space-y-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t(
                                            "Select additional dates to create more classes with the same details (student, location, etc.)",
                                            "เลือกวันเพิ่มเติมเพื่อสร้างชั้นเรียนเพิ่มเติมที่มีรายละเอียดเหมือนกัน (นักเรียน สถานที่ ฯลฯ)"
                                        )}
                                    </p>

                                    <MultiDateCalendar
                                        selectedDates={selectedNewDates}
                                        onDatesChange={setSelectedNewDates}
                                        minDate={new Date()}
                                        maxSelections={14}
                                    />

                                    {selectedNewDates.length > 0 && (
                                        <div>
                                            <label htmlFor="time" className="block text-sm font-medium mb-2">
                                                {t(
                                                    selectedNewDates.length > 1 ? "Time for all new classes" : "Select Time",
                                                    selectedNewDates.length > 1 ? "เวลาสำหรับทุกคลาสใหม่" : "เลือกเวลา"
                                                )}
                                            </label>
                                            <input
                                                type="time"
                                                id="time"
                                                value={selectedTime}
                                                onChange={(e) => setSelectedTime(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
                                            />
                                        </div>
                                    )}

                                    {selectedNewDates.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    // Combine dates with selected time
                                                    const datesWithTime = selectedNewDates.map(dateTimestamp => {
                                                        const date = new Date(dateTimestamp);
                                                        const [hours, minutes] = selectedTime.split(":");
                                                        date.setHours(Number.parseInt(hours), Number.parseInt(minutes));
                                                        return date.getTime();
                                                    });

                                                    await addDatesToClass({
                                                        userId: currentUserId,
                                                        classId: classData._id,
                                                        newDates: datesWithTime,
                                                    });

                                                    toast.success(
                                                        `Successfully added ${selectedNewDates.length} date(s)!`,
                                                        `เพิ่ม ${selectedNewDates.length} วันสำเร็จแล้ว!`
                                                    );

                                                    // Reset
                                                    setSelectedNewDates([]);
                                                    setShowAddDates(false);
                                                    onSuccess(); // Refresh parent
                                                } catch (err) {
                                                    toast.error(
                                                        err instanceof Error ? err.message : "Failed to add dates",
                                                        "ไม่สามารถเพิ่มวันได้"
                                                    );
                                                }
                                            }}
                                            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
                                        >
                                            {t(
                                                `Add ${selectedNewDates.length} Date${selectedNewDates.length > 1 ? 's' : ''}`,
                                                `เพิ่ม ${selectedNewDates.length} วัน`
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Add Students to This Class Section */}
                        <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setShowAddStudents(!showAddStudents)}
                                className="flex items-center gap-2 text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium mb-4"
                            >
                                {showAddStudents ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                <UserPlus className="w-5 h-5" />
                                {t("Add Student(s) to This Class", "เพิ่มนักเรียนในคลาสนี้")}
                            </button>

                            {showAddStudents && (
                                <div className="space-y-4 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t(
                                            "Add additional students to this class session. The primary student will remain unchanged.",
                                            "เพิ่มนักเรียนเพิ่มเติมในคลาสนี้ นักเรียนหลักจะไม่เปลี่ยนแปลง"
                                        )}
                                    </p>

                                    {/* Current students display */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t("Current Students in Class", "นักเรียนในคลาสปัจจุบัน")}
                                        </label>
                                        <div className="space-y-2">
                                            {/* Primary Student */}
                                            {students && (
                                                <div className="flex items-center justify-between p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        <span className="font-medium text-blue-900 dark:text-blue-100">
                                                            {students.find(s => s._id === studentId)?.firstName} {students.find(s => s._id === studentId)?.lastName}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded">
                                                            {t("Primary", "หลัก")}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Additional Students */}
                                            {currentAdditionalStudents.length > 0 && students && currentAdditionalStudents.map((addStudentId) => {
                                                const student = students.find(s => s._id === addStudentId);
                                                if (!student) return null;
                                                return (
                                                    <div key={addStudentId} className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                            <span className="font-medium">
                                                                {student.firstName} {student.lastName}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    await removeStudentFromClass({
                                                                        userId: currentUserId,
                                                                        classId: classData._id,
                                                                        studentId: addStudentId,
                                                                    });
                                                                    setCurrentAdditionalStudents(prev => 
                                                                        prev.filter(id => id !== addStudentId)
                                                                    );
                                                                    toast.success(
                                                                        "Student removed from class",
                                                                        "ลบนักเรียนออกจากคลาสแล้ว"
                                                                    );
                                                                    onSuccess(); // Refresh parent
                                                                } catch (err) {
                                                                    toast.error(
                                                                        err instanceof Error ? err.message : "Failed to remove student",
                                                                        "ไม่สามารถลบนักเรียนได้"
                                                                    );
                                                                }
                                                            }}
                                                            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                                                            title={t("Remove student", "ลบนักเรียน")}
                                                        >
                                                            <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            {currentAdditionalStudents.length === 0 && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                    {t("No additional students added yet", "ยังไม่มีนักเรียนเพิ่มเติม")}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Add Student Selector */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {t("Select Student to Add", "เลือกนักเรียนที่จะเพิ่ม")}
                                        </label>
                                        <select
                                            value={selectedStudentToAdd}
                                            onChange={(e) => setSelectedStudentToAdd(e.target.value as Id<"students"> | "")}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-700"
                                        >
                                            <option value="">{t("-- Select Student --", "-- เลือกนักเรียน --")}</option>
                                            {students?.filter(s => 
                                                s._id !== studentId && // Not the primary student
                                                !currentAdditionalStudents.includes(s._id) // Not already added
                                            ).map((student) => (
                                                <option key={student._id} value={student._id}>
                                                    {student.firstName} {student.lastName} ({student.grade}{student.class})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedStudentToAdd && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                try {
                                                    await addStudentToClass({
                                                        userId: currentUserId,
                                                        classId: classData._id,
                                                        studentId: selectedStudentToAdd as Id<"students">,
                                                    });
                                                    setCurrentAdditionalStudents(prev => 
                                                        [...prev, selectedStudentToAdd as Id<"students">]
                                                    );
                                                    setSelectedStudentToAdd("");
                                                    toast.success(
                                                        "Student added to class!",
                                                        "เพิ่มนักเรียนในคลาสสำเร็จ!"
                                                    );
                                                    onSuccess(); // Refresh parent
                                                } catch (err) {
                                                    toast.error(
                                                        err instanceof Error ? err.message : "Failed to add student",
                                                        "ไม่สามารถเพิ่มนักเรียนได้"
                                                    );
                                                }
                                            }}
                                            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <UserPlus className="w-5 h-5" />
                                            {t("Add Student", "เพิ่มนักเรียน")}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Footer - Sticky */}
                    <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex flex-col sm:flex-row gap-3">
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
                    </div>
                </form>
            </div>
        </div>
    );
}
