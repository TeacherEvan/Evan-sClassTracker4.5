"use client";

import { CollapsibleSection } from "@/components/collapsible-section";
import { ThailandLocationDropdown } from "@/components/thailand-location-dropdown";
import type { Doc } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { Plus, X } from "lucide-react";
import type { StudentFormData } from "./types";

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isEditing: boolean;
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
  schools?: Doc<"schools">[];
  myProviders?: Doc<"providers">[];
  currentUser: Doc<"users">;
  onCreateProviderClick: () => void;
}

export function StudentFormModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  isEditing,
  formData,
  setFormData,
  schools,
  myProviders,
  currentUser,
  onCreateProviderClick,
}: StudentFormModalProps) {
  const { t, language } = useLanguage();

  if (!isOpen) return null;

  const updateField = (
    field: keyof StudentFormData,
    value: string | number | boolean | undefined,
  ) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {isEditing
              ? t("Edit Student", "แก้ไขข้อมูลนักเรียน")
              : t("Add New Student", "เพิ่มนักเรียนใหม่")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Student Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {t("Student Information", "ข้อมูลนักเรียน")}
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("Nickname", "ชื่อเล่น")} *
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => updateField("nickname", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Grade", "ระดับชั้น")} *
                </label>
                <select
                  value={formData.grade}
                  onChange={(e) => updateField("grade", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">{t("Grade", "ระดับชั้น")}</option>
                  <option value="K1">K1</option>
                  <option value="K2">K2</option>
                  <option value="K3">K3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Class", "คลาส")}
                  {formData.schoolId ? " *" : ""}
                </label>
                <select
                  value={formData.studentClass}
                  onChange={(e) => updateField("studentClass", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  required={!!formData.schoolId}
                >
                  <option value="">{t("Select Class", "เลือกคลาส")}</option>
                  <option value="/1">/1</option>
                  <option value="/2">/2</option>
                  <option value="/3">/3</option>
                  <option value="/4">/4</option>
                  <option value="/5">/5</option>
                  <option value="/6">/6</option>
                  <option value="/7">/7</option>
                  <option value="/8">/8</option>
                  <option value="/9">/9</option>
                  <option value="/10">/10</option>
                </select>
              </div>
            </div>

            {/* School OR Provider Selection (not for moderators) */}
            {currentUser.role !== "moderator" && (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {t(
                    "School OR Provider (Choose One)",
                    "โรงเรียนหรือผู้ให้บริการ (เลือกอย่างใดอย่างหนึ่ง)",
                  )}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* School Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("School", "โรงเรียน")}
                    </label>
                    <select
                      value={formData.schoolId}
                      onChange={(e) => {
                        updateField("schoolId", e.target.value);
                        if (e.target.value) updateField("providerId", ""); // Clear provider if school selected
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {t("No School", "ไม่มีโรงเรียน")}
                      </option>
                      {schools?.map((school) => (
                        <option key={school._id} value={school._id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Provider Dropdown */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Provider", "ผู้ให้บริการ")}
                    </label>
                    <select
                      value={formData.providerId}
                      onChange={(e) => {
                        updateField("providerId", e.target.value);
                        if (e.target.value) updateField("schoolId", ""); // Clear school if provider selected
                      }}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">
                        {t("No Provider", "ไม่มีผู้ให้บริการ")}
                      </option>
                      {myProviders?.map((provider) => (
                        <option key={provider._id} value={provider._id}>
                          {language === "th" ? provider.nameTh : provider.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={onCreateProviderClick}
                      className="mt-2 w-full px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      {t("Create New Provider", "สร้างผู้ให้บริการใหม่")}
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t(
                    "Select either a school OR a provider (not both). Leave both empty to link to guardian only.",
                    "เลือกโรงเรียนหรือผู้ให้บริการ (ไม่ใช่ทั้งสองอย่าง) เว้นว่างทั้งสองเพื่อเชื่อมโยงกับผู้ปกครองเท่านั้น",
                  )}
                </p>
              </div>
            )}

            {/* Moderators see school dropdown only (no provider option) */}
            {currentUser.role === "moderator" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("School", "โรงเรียน")}
                </label>
                <select
                  value={formData.schoolId}
                  onChange={(e) => updateField("schoolId", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    {t("No School (Guardian)", "ไม่มีโรงเรียน (ผู้ปกครอง)")}
                  </option>
                  {schools?.map((school) => (
                    <option key={school._id} value={school._id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Guardian Information */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {t("Guardian Information", "ข้อมูลผู้ปกครอง")}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t(
                "Required if no school is selected",
                "จำเป็นหากไม่ได้เลือกโรงเรียน",
              )}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("Guardian Name", "ชื่อผู้ปกครอง")}
              </label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(e) => updateField("guardianName", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Guardian Phone", "เบอร์โทรผู้ปกครอง")}
                </label>
                <input
                  type="tel"
                  value={formData.guardianPhone}
                  onChange={(e) => updateField("guardianPhone", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t("Guardian Email", "อีเมลผู้ปกครอง")}
                </label>
                <input
                  type="email"
                  value={formData.guardianEmail}
                  onChange={(e) => updateField("guardianEmail", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Optional Fields Section - Pattern #20 Collapsible */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <CollapsibleSection
              titleEn="Additional Information (Optional)"
              titleTh="ข้อมูลเพิ่มเติม (ไม่บังคับ)"
              defaultOpen={false}
            >
              <div className="space-y-4">
                {/* Nickname & Date of Birth */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Nickname", "ชื่อเล่น")}
                    </label>
                    <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => updateField("nickname", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder={t("e.g., Bee", "เช่น ผึ้ง")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Date of Birth", "วันเกิด")}
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) =>
                        updateField("dateOfBirth", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Thailand Location (Province/District) - NEW Dec 2025 */}
                <div className="pt-2">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {t("Location (Thailand)", "ที่อยู่ (ประเทศไทย)")}
                  </h5>
                  <ThailandLocationDropdown
                    provinceCode={formData.provinceCode}
                    districtName={formData.districtName}
                    onProvinceChange={(code) =>
                      updateField("provinceCode", code)
                    }
                    onDistrictChange={(name) =>
                      updateField("districtName", name)
                    }
                    showLabels={true}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Primary Parent Contact */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("Primary Parent Contact", "ผู้ปกครองหลัก")}
                  </h5>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Parent Name", "ชื่อผู้ปกครอง")}
                    </label>
                    <input
                      type="text"
                      value={formData.parentName}
                      onChange={(e) =>
                        updateField("parentName", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("Parent Phone", "เบอร์โทรผู้ปกครอง")}
                      </label>
                      <input
                        type="tel"
                        value={formData.parentPhone}
                        onChange={(e) =>
                          updateField("parentPhone", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("Parent Email", "อีเมลผู้ปกครอง")}
                      </label>
                      <input
                        type="email"
                        value={formData.parentEmail}
                        onChange={(e) =>
                          updateField("parentEmail", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Secondary Parent Contact */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("Secondary Parent Contact", "ผู้ปกครองรอง")}
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("Secondary Parent Name", "ชื่อผู้ปกครองรอง")}
                      </label>
                      <input
                        type="text"
                        value={formData.secondaryParentName}
                        onChange={(e) =>
                          updateField("secondaryParentName", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("Secondary Parent Phone", "เบอร์ผู้ปกครองรอง")}
                      </label>
                      <input
                        type="tel"
                        value={formData.secondaryParentPhone}
                        onChange={(e) =>
                          updateField("secondaryParentPhone", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Health & Special Information */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("Health & Special Information", "ข้อมูลสุขภาพและพิเศษ")}
                  </h5>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Allergies", "อาการแพ้")}
                    </label>
                    <textarea
                      value={formData.allergies}
                      onChange={(e) => updateField("allergies", e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder={t(
                        "e.g., Peanuts, shellfish",
                        "เช่น ถั่ว, อาหารทะเล",
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Special Needs", "ความต้องการพิเศษ")}
                    </label>
                    <textarea
                      value={formData.specialNeeds}
                      onChange={(e) =>
                        updateField("specialNeeds", e.target.value)
                      }
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder={t(
                        "e.g., ADHD, dyslexia",
                        "เช่น ADHD, ดิสเลกเซีย",
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t("Medical Notes", "หมายเหตุทางการแพทย์")}
                    </label>
                    <textarea
                      value={formData.medicalNotes}
                      onChange={(e) =>
                        updateField("medicalNotes", e.target.value)
                      }
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder={t(
                        "Any medical conditions or medications",
                        "โรคประจำตัวหรือยาที่ต้องรับประทาน",
                      )}
                    />
                  </div>
                </div>

                {/* General Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("Additional Notes", "หมายเหตุเพิ่มเติม")}
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField("notes", e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    placeholder={t(
                      "Any other important information",
                      "ข้อมูลสำคัญอื่นๆ",
                    )}
                  />
                </div>
              </div>
            </CollapsibleSection>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  {t("Saving...", "กำลังบันทึก...")}
                </>
              ) : isEditing ? (
                t("Update Student", "อัปเดต")
              ) : (
                t("Add Student", "เพิ่มนักเรียน")
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("Cancel", "ยกเลิก")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
