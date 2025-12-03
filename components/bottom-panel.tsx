"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { Activity, BookOpen, Calendar, X } from "lucide-react";

type UserRole = "admin" | "moderator" | "teacher";

interface BottomPanelProps {
  userId: Id<"users">;
  userRole: UserRole;
  onClose: () => void;
}

export default function BottomPanel({ userId, userRole, onClose }: BottomPanelProps) {
  const { t } = useLanguage();

  // Query recent activity based on user role
  const recentClasses = useQuery(
    api.classes.list,
    userRole === "teacher"
      ? { teacherId: userId }
      : userRole === "moderator"
        ? { status: "pending" }
        : "skip"
  );

  // Get only the first 5 recent classes
  const displayClasses = recentClasses?.slice(0, 5) || [];

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t("Activity Feed", "กิจกรรมล่าสุด")}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={t("Close", "ปิด")}
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Recent Classes Section */}
          {displayClasses.length > 0 && (
            <div>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen className="w-4 h-4" />
                {t("Recent Classes", "คลาสล่าสุด")}
              </h3>
              <div className="space-y-2">
                {displayClasses.map((classItem) => (
                  <div
                    key={classItem._id}
                    className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {classItem.subject || classItem.subjectTh || classItem.lessonTopic || classItem.lessonTopicTh || t("Class", "คลาส")}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-gray-500" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {format(classItem.scheduledDate, "MMM d, yyyy")}
                          {classItem.duration && ` • ${classItem.duration} min`}
                        </p>
                      </div>
                    </div>
                    <div className="ml-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${classItem.status === "approved"
                          ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                          : classItem.status === "pending"
                            ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                      >
                        {t(
                          classItem.status.charAt(0).toUpperCase() + classItem.status.slice(1),
                          classItem.status === "approved"
                            ? "อนุมัติแล้ว"
                            : classItem.status === "pending"
                              ? "รอดำเนินการ"
                              : classItem.status
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {displayClasses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Activity className="w-12 h-12 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("No recent activity", "ไม่มีกิจกรรมล่าสุด")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t("Activity will appear here as you use the app", "กิจกรรมจะปรากฏที่นี่เมื่อคุณใช้แอป")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {t("Showing recent classes", "แสดงคลาสล่าสุด")}
        </p>
      </div>
    </div>
  );
}
