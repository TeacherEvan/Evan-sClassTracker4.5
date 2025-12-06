"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { showToast } from "@/lib/toast";
import type { User } from "@/lib/types";
import { useQuery, useMutation } from "convex/react";
import { Flag, FlagOff, Calendar, Clock, MapPin, User as UserIcon } from "lucide-react";
import { useMemo } from "react";

interface FlaggedClassesReviewProps {
    currentUser: User;
}

export function FlaggedClassesReview({ currentUser }: FlaggedClassesReviewProps) {
    const { t, language } = useLanguage();
    
    // Get school ID (moderators use their assigned school)
    const schoolId = currentUser.schoolId!;

    // Fetch flagged classes
    const flaggedClasses = useQuery(
        schoolId ? api.classReview.getFlaggedClasses : "skip",
        schoolId ? { schoolId, userId: currentUser._id } : "skip"
    );

    const unflagClass = useMutation(api.classReview.unflagClass);

    // Group classes by status
    const groupedClasses = useMemo(() => {
        if (!flaggedClasses) return { approved: [], pending: [], rejected: [] };
        
        return {
            approved: flaggedClasses.filter(c => c.status === "approved"),
            pending: flaggedClasses.filter(c => c.status === "pending"),
            rejected: flaggedClasses.filter(c => c.status === "rejected"),
        };
    }, [flaggedClasses]);
    
    // Only moderators and admins can use this component
    if (currentUser.role !== "moderator" && currentUser.role !== "admin") {
        return null;
    }

    // Moderators must have a schoolId
    if (currentUser.role === "moderator" && !currentUser.schoolId) {
        return (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                    {t(
                        "You must be assigned to a school to review flagged classes.",
                        "คุณต้องได้รับมอบหมายให้กับโรงเรียนเพื่อตรวจสอบคลาสที่ถูกทำเครื่องหมาย"
                    )}
                </p>
            </div>
        );
    }

    const handleUnflag = async (classId: Id<"classes">) => {
        const confirmed = window.confirm(
            t(
                "Remove flag from this class?",
                "ลบเครื่องหมายออกจากคลาสนี้?"
            )
        );

        if (!confirmed) return;

        try {
            await unflagClass({
                classId,
                userId: currentUser._id,
            });

            showToast(
                "success",
                t("Class unflagged successfully", "ลบเครื่องหมายคลาสสำเร็จ")
            );
        } catch (err) {
            showToast(
                "error",
                err instanceof Error ? err.message : "Failed to unflag class"
            );
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(language === "th" ? "th-TH" : "en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const renderClassCard = (cls: NonNullable<typeof flaggedClasses>[number]) => {
        const locationDisplay = language === "th" 
            ? (cls.locationNameTh || cls.locationName) 
            : (cls.locationName || cls.locationNameTh);
        
        const reviewNotesDisplay = language === "th"
            ? (cls.reviewNotesTh || cls.reviewNotes)
            : (cls.reviewNotes || cls.reviewNotesTh);

        return (
            <div
                key={cls.classId}
                className="rounded-lg border border-orange-200 bg-white p-4 shadow-sm"
            >
                {/* Status badge */}
                <div className="mb-3 flex items-start justify-between">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        cls.status === "approved" ? "bg-green-100 text-green-700" :
                        cls.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                    }`}>
                        {t(
                            cls.status.charAt(0).toUpperCase() + cls.status.slice(1),
                            cls.status === "approved" ? "อนุมัติ" :
                            cls.status === "pending" ? "รอดำเนินการ" : "ปฏิเสธ"
                        )}
                    </span>
                    <button
                        onClick={() => handleUnflag(cls.classId)}
                        className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                    >
                        <FlagOff className="h-3 w-3" />
                        {t("Unflag", "ลบเครื่องหมาย")}
                    </button>
                </div>

                {/* Class details */}
                <div className="space-y-2">
                    {/* Date and time */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span>{formatDate(cls.scheduledDate)}</span>
                        <Clock className="ml-2 h-4 w-4 text-blue-600" />
                        <span>{cls.duration} {t("min", "นาที")}</span>
                    </div>

                    {/* Teacher */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <UserIcon className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{cls.teacherName}</span>
                    </div>

                    {/* Student */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                        <UserIcon className="h-4 w-4 text-green-600" />
                        <span>
                            {cls.studentName}
                            {cls.studentGrade && (
                                <span className="ml-2 text-xs text-gray-500">
                                    ({cls.studentGrade}{cls.studentClass})
                                </span>
                            )}
                        </span>
                    </div>

                    {/* Location */}
                    {locationDisplay && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <span>{locationDisplay}</span>
                        </div>
                    )}
                </div>

                {/* Review notes */}
                {reviewNotesDisplay && (
                    <div className="mt-3 rounded-md bg-orange-50 p-3">
                        <p className="text-xs font-medium text-orange-900">
                            {t("Review Notes:", "บันทึกการตรวจสอบ:")}
                        </p>
                        <p className="mt-1 text-sm text-orange-800">
                            {reviewNotesDisplay}
                        </p>
                    </div>
                )}

                {/* Flagged info */}
                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-2 text-xs text-gray-500">
                    <span>
                        {t("Flagged by:", "ทำเครื่องหมายโดย:")} {cls.flaggedBy}
                    </span>
                    <span>{formatDate(cls.flaggedAt)}</span>
                </div>

                {/* Report inclusion status */}
                {!cls.includeInReports && (
                    <div className="mt-2 rounded-md bg-gray-100 p-2 text-center">
                        <p className="text-xs font-medium text-gray-700">
                            ⚠️ {t("Excluded from reports", "ไม่รวมในรายงาน")}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Flag className="h-6 w-6 text-orange-600" />
                <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t("Flagged Classes for Review", "คลาสที่ทำเครื่องหมายเพื่อตรวจสอบ")}
                    </h2>
                    <p className="text-sm text-gray-600">
                        {t(
                            "Classes that require attention or follow-up",
                            "คลาสที่ต้องการความสนใจหรือติดตามผล"
                        )}
                    </p>
                </div>
            </div>

            {/* Loading state */}
            {flaggedClasses === undefined && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                    <p className="text-gray-600">
                        {t("Loading flagged classes...", "กำลังโหลดคลาสที่ทำเครื่องหมาย...")}
                    </p>
                </div>
            )}

            {/* Empty state */}
            {flaggedClasses && flaggedClasses.length === 0 && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
                    <Flag className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                    <p className="text-gray-600">
                        {t(
                            "No flagged classes. Great job keeping everything organized!",
                            "ไม่มีคลาสที่ทำเครื่องหมาย ทำได้ดีมากในการจัดระเบียบทุกอย่าง!"
                        )}
                    </p>
                </div>
            )}

            {/* Approved flagged classes */}
            {groupedClasses.approved.length > 0 && (
                <div>
                    <h3 className="mb-3 text-lg font-medium text-green-900">
                        {t(
                            `Approved Classes (${groupedClasses.approved.length})`,
                            `คลาสที่อนุมัติแล้ว (${groupedClasses.approved.length})`
                        )}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {groupedClasses.approved.map(renderClassCard)}
                    </div>
                </div>
            )}

            {/* Pending flagged classes */}
            {groupedClasses.pending.length > 0 && (
                <div>
                    <h3 className="mb-3 text-lg font-medium text-yellow-900">
                        {t(
                            `Pending Classes (${groupedClasses.pending.length})`,
                            `คลาสที่รอดำเนินการ (${groupedClasses.pending.length})`
                        )}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {groupedClasses.pending.map(renderClassCard)}
                    </div>
                </div>
            )}

            {/* Rejected flagged classes */}
            {groupedClasses.rejected.length > 0 && (
                <div>
                    <h3 className="mb-3 text-lg font-medium text-red-900">
                        {t(
                            `Rejected Classes (${groupedClasses.rejected.length})`,
                            `คลาสที่ปฏิเสธ (${groupedClasses.rejected.length})`
                        )}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {groupedClasses.rejected.map(renderClassCard)}
                    </div>
                </div>
            )}
        </div>
    );
}
