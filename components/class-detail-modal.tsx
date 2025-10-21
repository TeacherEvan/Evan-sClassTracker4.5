"use client";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { UserRole } from "@/lib/types";
import {
    BookOpen,
    Calendar,
    ClipboardList,
    Clock,
    Edit2,
    FileText,
    MapPin,
    Package,
    School,
    User,
    Users,
    X
} from "lucide-react";
import { useState } from "react";
import { EditClassModal } from "./edit-class-modal";
import { MergeClassesModal } from "./merge-classes-modal";

// Type for enriched class data from listWithDetails query
type ClassWithDetails = {
    _id: Id<"classes">;
    studentId: Id<"students">;
    teacherId: Id<"users">;
    schoolId: Id<"schools">;
    locationId?: Id<"locations">;
    scheduledDate: number;
    status: "pending" | "acknowledged" | "approved" | "rejected";
    student: Doc<"students"> | null;
    additionalStudents?: (Doc<"students"> | null)[];
    location: Doc<"locations"> | null;
    additionalStudentIds?: Id<"students">[];
    pendingLocationName?: string;
    pendingLocationNameTh?: string;
    guardianTitle?: string;
    duration?: number;
    subject?: string;
    subjectTh?: string;
    lessonTopic?: string;
    lessonTopicTh?: string;
    materials?: string;
    materialsTh?: string;
    preparationNotes?: string;
    preparationNotesTh?: string;
    classType?: "regular" | "makeup" | "trial" | "assessment" | "special";
    isEdited?: boolean;
    editHistory?: Array<{
        editedAt: number;
        editedBy: Id<"users">;
        editedByName: string;
        editedByRole: string;
        changes: Array<{
            field: string;
            oldValue: unknown;
            newValue: unknown;
        }>;
    }>;
};

interface ClassDetailModalProps {
    classData: Doc<"classes">;
    studentData: Doc<"students"> | null;
    locationData: Doc<"locations"> | null;
    schoolData: Doc<"schools"> | null;
    teacherData: Doc<"users"> | null;
    additionalStudents?: (Doc<"students"> | null)[];
    currentUserId: Id<"users">;
    currentUserRole: UserRole;
    allClasses?: ClassWithDetails[];
    onClose: () => void;
}

export function ClassDetailModal({
    classData,
    studentData,
    locationData,
    schoolData,
    teacherData,
    additionalStudents,
    currentUserId,
    currentUserRole,
    allClasses,
    onClose,
}: ClassDetailModalProps) {
    const { t, language } = useLanguage();
    const [showEditModal, setShowEditModal] = useState(false);
    const [showMergeModal, setShowMergeModal] = useState(false);

    const getStatusBadge = (status: string) => {
        const badges = {
            pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
            acknowledged: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
            approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
            rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
        };
        return badges[status as keyof typeof badges] || badges.pending;
    };

    const getStatusText = (status: string) => {
        const texts = {
            pending: t("Pending", "รอดำเนินการ"),
            acknowledged: t("Acknowledged", "รับทราบแล้ว"),
            approved: t("Approved", "อนุมัติแล้ว"),
            rejected: t("Rejected", "ปฏิเสธแล้ว"),
        };
        return texts[status as keyof typeof texts] || status;
    };

    const getClassTypeText = (type?: string) => {
        if (!type || type === "regular") return t("Regular Class", "คลาสปกติ");
        const types = {
            makeup: t("Makeup Class", "คลาสชดเชย"),
            trial: t("Trial Class", "คลาสทดลอง"),
            assessment: t("Assessment", "การประเมิน"),
            special: t("Special Event", "กิจกรรมพิเศษ"),
        };
        return types[type as keyof typeof types] || type;
    };

    const totalStudents = 1 + (additionalStudents?.length || 0);

    return (
        <>
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold mb-2">
                                {t("Class Details", "รายละเอียดคลาส")}
                            </h2>
                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(classData.status)}`}>
                                {getStatusText(classData.status)}
                            </span>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Student Information */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <h3 className="font-semibold text-lg">
                                    {t("Student Information", "ข้อมูลนักเรียน")}
                                </h3>
                                {totalStudents > 1 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                                        <Users className="w-3 h-3" />
                                        {totalStudents} {t("students", "คน")}
                                    </span>
                                )}
                            </div>
                            {studentData ? (
                                <div className="space-y-2">
                                    <p className="text-lg font-medium">
                                        {studentData.firstName} {studentData.lastName}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {t("Grade:", "ระดับชั้น:")} {studentData.grade}
                                    </p>
                                    {studentData.studentId && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                            ID: {studentData.studentId}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-red-600">{t("Student not found", "ไม่พบข้อมูลนักเรียน")}</p>
                            )}

                            {/* Additional Students */}
                            {additionalStudents && additionalStudents.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                                    <p className="text-sm font-medium mb-2">
                                        {t("Additional Students:", "นักเรียนเพิ่มเติม:")}
                                    </p>
                                    <div className="space-y-2">
                                        {additionalStudents.map((student) => (
                                            student && (
                                                <div key={student._id} className="flex items-center gap-2 text-sm">
                                                    <User className="w-4 h-4" />
                                                    <span>{student.firstName} {student.lastName}</span>
                                                    <span className="text-xs text-gray-500">({student.grade})</span>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Class Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* School */}
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <School className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        {t("School", "โรงเรียน")}
                                    </p>
                                    <p className="font-medium">
                                        {schoolData ? (language === "en" ? schoolData.name : schoolData.nameTh) : t("Not specified", "ไม่ระบุ")}
                                    </p>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        {t("Location", "สถานที่")}
                                    </p>
                                    <p className="font-medium">
                                        {locationData
                                            ? (language === "en" ? locationData.name : locationData.nameTh)
                                            : classData.pendingLocationName
                                                ? `${language === "en" ? classData.pendingLocationName : classData.pendingLocationNameTh} ${t("(Pending)", "(รออนุมัติ)")}`
                                                : t("Not specified", "ไม่ระบุ")
                                        }
                                    </p>
                                    {locationData?.type === "guardian" && classData.guardianTitle && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            {t("Guardian:", "ผู้ปกครอง:")} {classData.guardianTitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        {t("Date", "วันที่")}
                                    </p>
                                    <p className="font-medium">
                                        {new Date(classData.scheduledDate).toLocaleDateString(
                                            language === "en" ? "en-US" : "th-TH",
                                            { weekday: "long", year: "numeric", month: "long", day: "numeric" }
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Time */}
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        {t("Time", "เวลา")}
                                    </p>
                                    <p className="font-medium">
                                        {new Date(classData.scheduledDate).toLocaleTimeString(
                                            language === "en" ? "en-US" : "th-TH",
                                            { hour: "2-digit", minute: "2-digit" }
                                        )}
                                    </p>
                                    {classData.duration && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            {t("Duration:", "ระยะเวลา:")} {classData.duration} {t("minutes", "นาที")}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Teacher */}
                            {teacherData && (
                                <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl md:col-span-2">
                                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            {t("Teacher", "ครูผู้สอน")}
                                        </p>
                                        <p className="font-medium">
                                            {teacherData.username}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Optional Fields */}
                        {(classData.classType && classData.classType !== "regular") && (
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                    {t("Class Type", "ประเภทคลาส")}
                                </p>
                                <p className="font-medium">{getClassTypeText(classData.classType)}</p>
                            </div>
                        )}

                        {classData.subject && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <BookOpen className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            {t("Subject", "วิชา")}
                                        </p>
                                        <p className="font-medium">
                                            {language === "en" ? classData.subject : classData.subjectTh}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {classData.lessonTopic && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            {t("Lesson Topic", "หัวข้อบทเรียน")}
                                        </p>
                                        <p className="font-medium">
                                            {language === "en" ? classData.lessonTopic : classData.lessonTopicTh}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {classData.materials && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <Package className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            {t("Materials", "อุปกรณ์")}
                                        </p>
                                        <p className="font-medium whitespace-pre-wrap">
                                            {language === "en" ? classData.materials : classData.materialsTh}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {classData.preparationNotes && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <ClipboardList className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            {t("Preparation Notes", "หมายเหตุการเตรียมตัว")}
                                        </p>
                                        <p className="font-medium whitespace-pre-wrap">
                                            {language === "en" ? classData.preparationNotes : classData.preparationNotesTh}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Edit History */}
                        {classData.isEdited && classData.editHistory && classData.editHistory.length > 0 && (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center gap-2 mb-3">
                                    <Edit2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    <h3 className="font-semibold">
                                        {t("Edit History", "ประวัติการแก้ไข")}
                                    </h3>
                                </div>
                                <div className="space-y-2 text-sm">
                                    {classData.editHistory.slice(-3).reverse().map((edit, index) => (
                                        <div key={index} className="pb-2 border-b border-amber-200 dark:border-amber-800 last:border-0">
                                            <p className="font-medium">
                                                {edit.editedByName} ({edit.editedByRole})
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {new Date(edit.editedAt).toLocaleString(language === "en" ? "en-US" : "th-TH")}
                                            </p>
                                        </div>
                                    ))}
                                    {classData.editHistory.length > 3 && (
                                        <p className="text-xs text-gray-500 italic">
                                            {t(`+ ${classData.editHistory.length - 3} more edits`, `+ แก้ไขอีก ${classData.editHistory.length - 3} ครั้ง`)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6">
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setShowEditModal(true)}
                                className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-all font-medium"
                            >
                                <Edit2 className="w-5 h-5" />
                                {t("Edit Class", "แก้ไขคลาส")}
                            </button>
                            {allClasses && allClasses.length > 1 && (currentUserRole === "admin" || currentUserRole === "moderator") && (
                                <button
                                    onClick={() => setShowMergeModal(true)}
                                    className="flex-1 min-w-[200px] flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:scale-95 transition-all font-medium"
                                >
                                    <Users className="w-5 h-5" />
                                    {t("Merge Classes", "รวมคลาส")}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <EditClassModal
                    classData={classData}
                    currentUserId={currentUserId}
                    onClose={() => setShowEditModal(false)}
                    onSuccess={() => {
                        setShowEditModal(false);
                        onClose(); // Close detail modal after successful edit
                    }}
                />
            )}

            {/* Merge Modal */}
            {showMergeModal && allClasses && (
                <MergeClassesModal
                    userId={currentUserId}
                    classes={allClasses}
                    onClose={() => setShowMergeModal(false)}
                    onSuccess={() => {
                        setShowMergeModal(false);
                        onClose(); // Close detail modal after successful merge
                    }}
                />
            )}
        </>
    );
}
