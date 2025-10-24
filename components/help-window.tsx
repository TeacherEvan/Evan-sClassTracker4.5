"use client";

import { HelpDetailModal } from "@/components/help-detail-modal";
import { getHelpForRole, type HelpFeature } from "@/lib/help-content";
import { useLanguage } from "@/lib/language-context";
import { BookOpen, ChevronRight, HelpCircle, X } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { useState } from "react";

interface HelpWindowProps {
  userRole: "teacher" | "moderator" | "admin" | "guardian";
  onClose: () => void;
}

export function HelpWindow({ userRole, onClose }: HelpWindowProps) {
  const { t, language } = useLanguage();
  const [selectedFeature, setSelectedFeature] = useState<HelpFeature | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Get help content filtered by user role
  const helpCategories = getHelpForRole(userRole);

  // Get icon component from lucide-react
  const getIcon = (iconName: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<{ className?: string }>>)[iconName] || LucideIcons.Sparkles;
    return Icon;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleFeatureClick = (feature: HelpFeature) => {
    setSelectedFeature(feature);
  };

  const handleBack = () => {
    setSelectedFeature(null);
  };

  // Get role display name
  const getRoleDisplay = () => {
    switch (userRole) {
      case "teacher":
        return language === "th" ? "ครู" : "Teacher";
      case "moderator":
        return language === "th" ? "ผู้ดูแล" : "Boss";
      case "admin":
        return language === "th" ? "อีวาน" : "Evan";
      case "guardian":
        return language === "th" ? "ผู้ปกครอง" : "Guardian";
      default:
        return "";
    }
  };

  // Show detail modal if a feature is selected
  if (selectedFeature) {
    return (
      <HelpDetailModal
        feature={selectedFeature}
        onClose={onClose}
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-500">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 p-6 md:p-8 rounded-t-3xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
            aria-label={t("Close", "ปิด")}
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {t("Help & Guide", "ความช่วยเหลือและคู่มือ")}
              </h1>
              <p className="text-white/90 text-lg mt-1">
                {t(`Welcome ${getRoleDisplay()}! What would you like to do?`, `ยินดีต้อนรับ ${getRoleDisplay()}! คุณต้องการทำอะไร?`)}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400 text-base">
              {t(
                "Browse the features below to learn how to use the Class Tracker system. Click any feature to see detailed instructions.",
                "เรียกดูฟีเจอร์ด้านล่างเพื่อเรียนรู้วิธีใช้ระบบติดตามชั้นเรียน คลิกฟีเจอร์ใดก็ได้เพื่อดูคำแนะนำโดยละเอียด"
              )}
            </p>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            {helpCategories.map((category) => {
              const isExpanded = expandedCategories.has(category.id);
              const CategoryIcon = getIcon(category.icon);
              const categoryTitle = language === "th" ? category.titleTh : category.title;

              return (
                <div
                  key={category.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/50"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/40 dark:to-purple-900/40 rounded-xl">
                        <CategoryIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {categoryTitle}
                      </h2>
                      <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                        {category.features.length} {t("features", "ฟีเจอร์")}
                      </span>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Category Features */}
                  {isExpanded && (
                    <div className="p-5 pt-0 space-y-3 animate-in slide-in-from-top duration-300">
                      {category.features.map((feature) => {
                        const FeatureIcon = getIcon(feature.icon);
                        const featureTitle = language === "th" ? feature.titleTh : feature.title;
                        const featureDesc = language === "th" ? feature.shortDescriptionTh : feature.shortDescription;

                        return (
                          <button
                            key={feature.id}
                            onClick={() => handleFeatureClick(feature)}
                            className="w-full group p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 text-left"
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0 p-3 bg-blue-600 text-white rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <FeatureIcon className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                  {featureTitle}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {featureDesc}
                                </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-2xl border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-4">
              <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">
                  {t("Need more help?", "ต้องการความช่วยเหลือเพิ่มเติม?")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t(
                    "Click the 'Contact Admin' button in the top right to send a message to the system administrators.",
                    "คลิกปุ่ม 'ติดต่อผู้จัดการ' ที่มุมขวาบนเพื่อส่งข้อความถึงผู้จัดการระบบ"
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
