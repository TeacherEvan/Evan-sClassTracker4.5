"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/lib/language-context";
import { Database, CheckCircle } from "lucide-react";

export function DatabaseInit() {
  const { t } = useLanguage();
  const initializeDatabase = useMutation(api.init.initializeDatabase);
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInitialize = async () => {
    setLoading(true);
    setError("");
    
    try {
      const res = await initializeDatabase({});
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize database");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <h2 className="text-2xl font-bold">
              {t("Database Initialized!", "เริ่มต้นฐานข้อมูลแล้ว!")}
            </h2>
          </div>

          {result.credentials && (
            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
                <p className="font-medium mb-2">
                  {t("Default Login Credentials:", "ข้อมูลเข้าสู่ระบบเริ่มต้น:")}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Admin:</span>
                    <code>
                      {result.credentials.admin.username} / {result.credentials.admin.password}
                    </code>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Moderator:</span>
                    <code>
                      {result.credentials.moderator.username} / {result.credentials.moderator.password}
                    </code>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Teacher:</span>
                    <code>
                      {result.credentials.teacher.username} / {result.credentials.teacher.password}
                    </code>
                  </div>
                </div>
                <p className="mt-3 text-xs">
                  {t(
                    "⚠️ Please change all passwords after first login!",
                    "⚠️ กรุณาเปลี่ยนรหัสผ่านทั้งหมดหลังจากเข้าสู่ระบบครั้งแรก!"
                  )}
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg">
                <p className="font-medium mb-2">
                  {t("Sample Schools Created:", "โรงเรียนตัวอย่างที่สร้าง:")}
                </p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {result.schools?.map((school: any, i: number) => (
                    <li key={i}>{school.name}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {t("Go to Login", "ไปที่หน้าเข้าสู่ระบบ")}
              </button>
            </div>
          )}

          {result.message && !result.credentials && (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {result.message}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                {t("Refresh Page", "รีเฟรชหน้า")}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-500" />
          <h2 className="text-2xl font-bold">
            {t("Initialize Database", "เริ่มต้นฐานข้อมูล")}
          </h2>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {t(
              "This will set up your database with:",
              "การดำเนินการนี้จะตั้งค่าฐานข้อมูลของคุณด้วย:"
            )}
          </p>

          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>
              {t(
                "Admin account (username: admin)",
                "บัญชีผู้ดูแลระบบ (ชื่อผู้ใช้: admin)"
              )}
            </li>
            <li>
              {t(
                "Sample moderator and teacher accounts",
                "บัญชีผู้ดูแลและครูตัวอย่าง"
              )}
            </li>
            <li>{t("Two sample schools", "โรงเรียนตัวอย่างสองโรงเรียน")}</li>
            <li>{t("Welcome notification", "การแจ้งเตือนต้อนรับ")}</li>
          </ul>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleInitialize}
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
          >
            {loading
              ? t("Initializing...", "กำลังเริ่มต้น...")
              : t("Initialize Database", "เริ่มต้นฐานข้อมูล")}
          </button>
        </div>
      </div>
    </div>
  );
}
