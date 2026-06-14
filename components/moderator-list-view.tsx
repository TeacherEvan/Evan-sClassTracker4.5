"use client";

import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "convex/react";
import { Users, Mail, Building2, Shield } from "lucide-react";

export function ModeratorListView() {
  const { t, language } = useLanguage();
  const moderators = useQuery(api.users.list, { role: "moderator" });
  const schools = useQuery(api.schools.list, {});

  const getSchoolName = (schoolId: string | undefined) => {
    if (!schoolId || !schools) return t("No school assigned", "ไม่มีโรงเรียน");
    const school = schools.find((s) => s._id === schoolId);
    if (!school) return t("Unknown school", "โรงเรียนที่ไม่รู้จัก");
    return language === "en" ? school.name : school.nameTh;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Shield className="w-8 h-8 text-purple-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("Moderator List", "รายชื่อผู้ดูแล")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                "School moderators and contact information",
                "ผู้ดูแลโรงเรียนและข้อมูลติดต่อ",
              )}
            </p>
          </div>
        </div>

        {/* Moderator List */}
        {moderators === undefined ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              {t("Loading moderators...", "กำลังโหลดผู้ดูแล...")}
            </p>
          </div>
        ) : moderators.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {t("No moderators found", "ไม่พบผู้ดูแล")}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              {t(
                "Moderators will appear here once created",
                "ผู้ดูแลจะปรากฏที่นี่เมื่อสร้างแล้ว",
              )}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {moderators.map((moderator) => (
              <div
                key={moderator._id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20"
              >
                {/* Moderator Info */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                    <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {moderator.username}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("Moderator", "ผู้ดูแล")}
                    </p>
                  </div>
                </div>

                {/* School Assignment */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span>{getSchoolName(moderator.schoolId)}</span>
                </div>

                {/* Contact Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                    onClick={() => {
                      // TODO: Implement messaging dialog or navigation to messaging
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    {t("Message", "ส่งข้อความ")}
                  </button>
                </div>

                {/* Created Date */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("Created:", "สร้างเมื่อ:")}{" "}
                    {new Date(moderator.createdAt).toLocaleDateString(
                      language === "en" ? "en-US" : "th-TH",
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
