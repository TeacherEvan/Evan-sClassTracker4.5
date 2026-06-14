"use client";

import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useQuery } from "convex/react";
import { BookOpen, ExternalLink, Loader2 } from "lucide-react";

interface TeacherHelperProps {
  currentUser: User;
}

export function TeacherHelper({}: TeacherHelperProps) {
  const { t, language } = useLanguage();
  const resources = useQuery(api.teacherResources.list);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t("Teacher's Helper", "ผู้ช่วยครู")}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t(
            "Quick access to popular teaching resources and educational tools",
            "เข้าถึงทรัพยากรการสอนและเครื่องมือการศึกษาที่นิยมได้อย่างรวดเร็ว",
          )}
        </p>
      </div>

      {/* Resources Loading State */}
      {resources === undefined && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">
            {t("Loading resources...", "กำลังโหลดทรัพยากร...")}
          </span>
        </div>
      )}

      {/* No Resources State */}
      {resources?.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 text-center">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t("No Resources Available", "ไม่มีทรัพยากร")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {t(
              "No teaching resources have been added yet. Check back soon!",
              "ยังไม่มีทรัพยากรการสอน กรุณาตรวจสอบอีกครั้งในภายหลัง!",
            )}
          </p>
        </div>
      )}

      {/* Resources Grid */}
      {resources !== undefined && resources.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {resources.map((resource) => (
              <a
                key={resource._id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400"
              >
                {/* Category Badge */}
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    {language === "en"
                      ? resource.category
                      : resource.categoryTh}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-start justify-between">
                  <span>
                    {language === "en" ? resource.title : resource.titleTh}
                  </span>
                  <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-2" />
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                  {language === "en"
                    ? resource.description
                    : resource.descriptionTh}
                </p>

                {/* URL Preview */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                    {resource.url}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {/* Footer Note */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
              {t(
                "💡 All links open in a new tab. Some resources may require free registration.",
                "💡 ลิงก์ทั้งหมดเปิดในแท็บใหม่ ทรัพยากรบางรายการอาจต้องลงทะเบียนฟรี",
              )}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
