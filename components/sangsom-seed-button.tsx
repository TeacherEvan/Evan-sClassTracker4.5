"use client";

import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import { useMutation } from "convex/react";
import { Calendar, CheckCircle } from "lucide-react";
import { useState } from "react";

/**
 * Admin component to seed Sangsom Project schedule data
 * This creates a Sangsom School, teacher, students, and all scheduled classes
 * for November 2025 based on the paper schedule.
 */
export function SangsomSeedButton() {
  const { t } = useLanguage();
  // @ts-expect-error - API will be generated after running convex dev
  const seedSangsomProject = useMutation(api.seedSangsomProject?.seedSangsomProject);
  // @ts-expect-error - API will be generated after running convex dev
  const checkSangsomData = useMutation(api.seedSangsomProject?.checkSangsomData);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    studentsCreated: number;
    classesCreated: number;
    credentials?: {
      teacher: { username: string; password: string };
      moderator: { username: string; password: string };
    };
    classes?: Array<{ date: string; time: string; classCode: string; topic: string }>;
  } | null>(null);
  const [existingData, setExistingData] = useState<{
    exists: boolean;
    classCount?: number;
    studentCount?: number;
  } | null>(null);

  const handleCheckData = async () => {
    setLoading(true);
    try {
      const data = await checkSangsomData({});
      setExistingData(data);
      
      if (data.exists) {
        toast.info(
          `Found Sangsom data: ${data.classCount} classes, ${data.studentCount} students`,
          `พบข้อมูลสังสม: ${data.classCount} คลาส, ${data.studentCount} นักเรียน`
        );
      } else {
        toast.info(
          "No Sangsom data found. Ready to seed.",
          "ไม่พบข้อมูลสังสม พร้อมที่จะเพิ่มข้อมูล"
        );
      }
    } catch (err) {
      toast.error(
        `Failed to check data: ${err instanceof Error ? err.message : "Unknown error"}`,
        `ตรวจสอบข้อมูลไม่สำเร็จ: ${err instanceof Error ? err.message : "ข้อผิดพลาดที่ไม่ทราบสาเหตุ"}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const res = await seedSangsomProject({});
      setResult(res);
      
      toast.success(
        `Successfully created ${res.classesCreated} classes for ${res.studentsCreated} students!`,
        `สร้าง ${res.classesCreated} คลาสสำหรับ ${res.studentsCreated} นักเรียนสำเร็จ!`
      );
    } catch (err) {
      toast.error(
        `Failed to seed data: ${err instanceof Error ? err.message : "Unknown error"}`,
        `เพิ่มข้อมูลไม่สำเร็จ: ${err instanceof Error ? err.message : "ข้อผิดพลาดที่ไม่ทราบสาเหตุ"}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calendar className="w-8 h-8 text-blue-500" />
        <div>
          <h2 className="text-2xl font-bold">
            {t("Sangsom Project Data Seeder", "เพิ่มข้อมูลโครงการสังสม")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t(
              "Import November 2025 schedule from paper document",
              "นำเข้าตารางเรียนเดือนพฤศจิกายน 2568 จากเอกสาร"
            )}
          </p>
        </div>
      </div>

      {existingData && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {existingData.exists ? (
              <>
                {t("Existing data found:", "พบข้อมูลที่มีอยู่:")}
                <br />
                {t(`${existingData.classCount} classes`, `${existingData.classCount} คลาส`)},{" "}
                {t(`${existingData.studentCount} students`, `${existingData.studentCount} นักเรียน`)}
              </>
            ) : (
              t("No existing data found", "ไม่พบข้อมูลที่มีอยู่")
            )}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            {t(
              "This will create Sangsom School, teacher พงศกร หน่อไฟ, students for all class codes (K.1/1 through K.3/10), and all scheduled classes for November 3-24, 2025.",
              "จะสร้างโรงเรียนสังสม, ครู พงศกร หน่อไฟ, นักเรียนสำหรับทุกคลาส (K.1/1 ถึง K.3/10), และทุกคลาสที่กำหนดไว้วันที่ 3-24 พฤศจิกายน 2568"
            )}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCheckData}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading
              ? t("Checking...", "กำลังตรวจสอบ...")
              : t("Check Existing Data", "ตรวจสอบข้อมูลที่มีอยู่")}
          </button>
          
          <button
            onClick={handleSeed}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            {loading
              ? t("Seeding...", "กำลังเพิ่มข้อมูล...")
              : t("Seed Sangsom Data", "เพิ่มข้อมูลสังสม")}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">{t("Success!", "สำเร็จ!")}</p>
          </div>

          {result.credentials && (
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="font-medium text-sm mb-2 text-green-800 dark:text-green-200">
                {t("Login Credentials:", "ข้อมูลเข้าสู่ระบบ:")}
              </p>
              <div className="space-y-1 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-semibold">Teacher:</span>
                  <code className="text-green-800 dark:text-green-200">
                    {result.credentials.teacher.username} / {result.credentials.teacher.password}
                  </code>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <span className="font-semibold">Moderator:</span>
                  <code className="text-green-800 dark:text-green-200">
                    {result.credentials.moderator.username} / {result.credentials.moderator.password}
                  </code>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm">
            <p className="font-medium mb-2 text-blue-800 dark:text-blue-200">
              {t("Summary:", "สรุป:")}
            </p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>
                {t(
                  `✓ Created ${result.studentsCreated} students`,
                  `✓ สร้าง ${result.studentsCreated} นักเรียน`
                )}
              </li>
              <li>
                {t(
                  `✓ Created ${result.classesCreated} classes`,
                  `✓ สร้าง ${result.classesCreated} คลาส`
                )}
              </li>
              <li>
                {t(
                  "✓ Schedule period: November 3-24, 2025",
                  "✓ ช่วงเวลา: 3-24 พฤศจิกายน 2568"
                )}
              </li>
            </ul>
          </div>

          {result.classes && result.classes.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg max-h-60 overflow-y-auto">
              <p className="font-medium text-sm mb-2">
                {t("Created Classes (sample):", "คลาสที่สร้าง (ตัวอย่าง):")}
              </p>
              <ul className="space-y-1 text-xs">
                {result.classes.slice(0, 10).map((cls, i: number) => (
                  <li key={i} className="text-gray-600 dark:text-gray-400">
                    {cls.date} {cls.time} - {cls.classCode}: {cls.topic}
                  </li>
                ))}
                {result.classes.length > 10 && (
                  <li className="text-gray-500 dark:text-gray-500 italic">
                    {t(
                      `... and ${result.classes.length - 10} more`,
                      `... และอีก ${result.classes.length - 10} คลาส`
                    )}
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
