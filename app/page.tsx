"use client";

import { LanguageSwitcher } from "@/components/language-switcher";
import { NotificationForm } from "@/components/notification-form";
import { NotificationList } from "@/components/notification-list";
import { useLanguage } from "@/lib/language-context";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen p-8">
      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {t("Class Tracker", "ติดตามชั้นเรียน")}
          </h1>
          <LanguageSwitcher />
        </div>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t(
            "Bilingual notification system for teachers and schools",
            "ระบบแจ้งเตือนสองภาษาสำหรับครูและโรงเรียน"
          )}
        </p>
      </header>

      <NotificationForm />
      <NotificationList />
    </div>
  );
}
