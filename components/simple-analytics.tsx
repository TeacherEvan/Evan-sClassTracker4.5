"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import { BarChart3, CheckCircle, Clock, XCircle } from "lucide-react";

interface SimpleAnalyticsProps {
    schoolId: Id<"schools">;
}

export function SimpleAnalytics({ schoolId }: SimpleAnalyticsProps) {
    const { t } = useLanguage();

    const classCount = useQuery(api.simpleAnalytics.getSchoolClassCount, { schoolId });

    if (!classCount) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="text-gray-500 dark:text-gray-400">
                    {t("Loading...", "กำลังโหลด...")}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold flex items-center gap-2">
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                    {t("Class Statistics", "สถิติชั้นเรียน")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {t(
                        "Overview of classes at your school",
                        "ภาพรวมชั้นเรียนที่โรงเรียนของคุณ"
                    )}
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Classes */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                            {t("Total Classes", "ชั้นเรียนทั้งหมด")}
                        </h3>
                    </div>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                        {classCount.total}
                    </p>
                </div>

                {/* Approved Classes */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <h3 className="font-semibold text-green-900 dark:text-green-100">
                            {t("Approved", "อนุมัติแล้ว")}
                        </h3>
                    </div>
                    <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                        {classCount.approved}
                    </p>
                </div>

                {/* Pending Classes */}
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                            {t("Pending", "รอดำเนินการ")}
                        </h3>
                    </div>
                    <p className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                        {classCount.pending}
                    </p>
                </div>

                {/* Rejected Classes */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        <h3 className="font-semibold text-red-900 dark:text-red-100">
                            {t("Rejected", "ปฏิเสธ")}
                        </h3>
                    </div>
                    <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                        {classCount.rejected}
                    </p>
                </div>
            </div>
        </div>
    );
}
