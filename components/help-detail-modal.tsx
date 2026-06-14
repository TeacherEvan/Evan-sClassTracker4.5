"use client";

import type { HelpFeature } from "@/lib/help-content";
import { getHelpIcon } from "@/lib/help-icons";
import { useLanguage } from "@/lib/language-context";
import { ArrowLeft, CheckCircle, Lightbulb, X } from "lucide-react";

interface HelpDetailModalProps {
  feature: HelpFeature;
  onClose: () => void;
  onBack?: () => void;
}

export function HelpDetailModal({
  feature,
  onClose,
  onBack,
}: HelpDetailModalProps) {
  const { t, language } = useLanguage();

  const title = language === "th" ? feature.titleTh : feature.title;
  const description =
    language === "th"
      ? feature.detailedDescriptionTh
      : feature.detailedDescription;

  const FeatureIcon = getHelpIcon(feature.icon);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-500">
        {/* Header with gradient - Sticky */}
        <div className="relative bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 md:p-8 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
                aria-label={t("Back", "กลับ")}
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={onClose}
              className="ml-auto p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors backdrop-blur-sm"
              aria-label={t("Close", "ปิด")}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <FeatureIcon className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {title}
              </h1>
            </div>
          </div>
        </div>

        {/* Content - Scrollable (SINGLE scroll area) */}
        <div className="overflow-y-auto flex-grow p-4 md:p-8 space-y-4 md:space-y-6">
          {/* Description */}
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Steps (if available) */}
          {feature.steps && feature.steps.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                {t("How to Use", "วิธีใช้งาน")}
              </h2>

              <div className="space-y-4">
                {feature.steps.map((step) => {
                  const stepDesc =
                    language === "th" ? step.descriptionTh : step.description;
                  const stepTip =
                    step.tip && (language === "th" ? step.tipTh : step.tip);

                  return (
                    <div key={step.step} className="group relative">
                      {/* Step card */}
                      <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all">
                        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full">
                          {step.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-white font-medium">
                            {stepDesc}
                          </p>

                          {/* Tip (if available) */}
                          {stepTip && (
                            <div className="mt-3 flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                <span className="font-semibold">
                                  {t("Tip:", "เคล็ดลับ:")}
                                </span>{" "}
                                {stepTip}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer - Sticky Call to Action */}
        <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-b-3xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">
                {t("Ready to try it?", "พร้อมลองหรือยัง?")}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  "Close this window and start using this feature!",
                  "ปิดหน้าต่างนี้และเริ่มใช้ฟีเจอร์นี้!",
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              {t("Got it!", "เข้าใจแล้ว!")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
