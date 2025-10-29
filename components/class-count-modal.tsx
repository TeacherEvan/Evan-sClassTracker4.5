"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    GraduationCap,
    MapPin,
    School,
    User,
    X,
} from "lucide-react";
import { useState } from "react";

interface ClassCountModalProps {
    teacherId: Id<"users">;
    onClose: () => void;
}

export function ClassCountModal({ teacherId, onClose }: ClassCountModalProps) {
    const { t, language } = useLanguage();
    const classCountDetails = useQuery(api.teacherClassCount.getMyClassCountDetails, {
        teacherId,
    });

    const [showAllClasses, setShowAllClasses] = useState(false);

    if (!classCountDetails) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                    </div>
                </div>
            </div>
        );
    }

    const { cycleInfo, summary, classes } = classCountDetails;
    const displayedClasses = showAllClasses ? classes : classes.slice(0, 5);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl">
                {/* Sticky Header */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 p-6 rounded-t-xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-white/20 rounded-full">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">
                                    {t("Your ClassCount", "จำนวนชั้นเรียนของคุณ")}
                                </h2>
                                <p className="text-sm text-white/90">
                                    {summary.totalClassCount} {t("classes this cycle", "ชั้นเรียนในรอบนี้")}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-grow">

                    {/* Disclaimer */}
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="space-y-2">
                                <p className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                                    {t(
                                        "This is your current class count for the month. Value will reset at the end of each cycle determined by your moderator.",
                                        "นี่คือจำนวนชั้นเรียนปัจจุบันของคุณสำหรับเดือนนี้ ค่าจะรีเซ็ตในตอนท้ายของแต่ละรอบที่กำหนดโดยผู้ดูแลของคุณ"
                                    )}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                        {t("Current Cycle:", "รอบปัจจุบัน:")} {new Date(cycleInfo.startDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")} -{" "}
                                        {new Date(cycleInfo.endDate).toLocaleDateString(language === "th" ? "th-TH" : "en-US")}
                                    </span>
                                </div>
                                {cycleInfo.notes && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 italic">
                                        {language === "th" ? cycleInfo.notesTh || cycleInfo.notes : cycleInfo.notes}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="p-6 grid grid-cols-2 gap-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                                    {t("Total ClassCount", "จำนวนชั้นเรียนรวม")}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                {summary.totalClassCount}
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    {t("Classes Counted", "ชั้นเรียนที่นับ")}
                                </span>
                            </div>
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                {summary.totalClasses}
                            </p>
                        </div>
                    </div>

                    {/* Classes List */}
                    <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4">
                            {t("Classes Counted & Acknowledged", "ชั้นเรียนที่นับและยอมรับแล้ว")}
                        </h3>

                        {classes.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>{t("No classes counted in this cycle yet", "ยังไม่มีชั้นเรียนที่นับในรอบนี้")}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayedClasses.map((cls) => (
                                    <div
                                        key={cls.classId}
                                        className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                                        {cls.primaryStudentName}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>
                                                            {new Date(cls.scheduledDate).toLocaleDateString(
                                                                language === "th" ? "th-TH" : "en-US"
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        <span>{cls.duration} min</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <School className="w-3.5 h-3.5" />
                                                        <span>{language === "th" ? cls.schoolNameTh : cls.schoolName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5" />
                                                        <span>{language === "th" ? cls.locationNameTh : cls.locationName}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-bold">
                                                    {cls.classCount}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {cls.studentCount} {cls.studentCount === 1 ? "student" : "students"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                            <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                                {t("Acknowledged by", "ยอมรับโดย")} {cls.acknowledgedBy}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {classes.length > 5 && !showAllClasses && (
                                    <button
                                        onClick={() => setShowAllClasses(true)}
                                        className="w-full py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-medium transition-colors"
                                    >
                                        {t(`Show All ${classes.length} Classes`, `แสดงทั้งหมด ${classes.length} ชั้นเรียน`)}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sticky Footer */}
                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl border-t border-gray-200 dark:border-gray-600">
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        {t(
                            "For full class history, visit the Teachers Log tab",
                            "สำหรับประวัติชั้นเรียนทั้งหมด ไปที่แท็บ Teachers Log"
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
