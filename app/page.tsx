"use client";

import { AdminContactButton } from "@/components/admin-contact-button";
import { ClassBooking } from "@/components/class-booking";
import { DatabaseInit } from "@/components/database-init";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/login-form";
import { MessagingHub } from "@/components/messaging-hub";
import { ModeratorListView } from "@/components/moderator-list-view";
import { NotificationForm } from "@/components/notification-form";
import { NotificationList } from "@/components/notification-list";
import { PasswordChangeDialog } from "@/components/password-change-dialog";
import { SchoolManagement } from "@/components/school-management";
import { StudentManagement } from "@/components/student-management";
import { UserManagement } from "@/components/user-management";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { ToastContainer, type ToastNotification } from "@/components/desktop-notification-toast";
import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/lib/language-context";
import { isDesktopDevice } from "@/lib/device-detection";
import type { User } from "@/lib/types";
import { useQuery } from "convex/react";
import { Bell, Building2, Calendar, CalendarDays, GraduationCap, LogOut, Users, MessageSquare, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { t } = useLanguage();
  const users = useQuery(api.users.list, {});
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "users" | "classes" | "calendar" | "schools" | "students" | "messages" | "moderators">("calendar");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check device type on mount
  useEffect(() => {
    setIsDesktop(isDesktopDevice());
  }, []);

  // Check if database needs initialization
  const needsInit = users !== undefined && users.length === 0;
  const isLoading = users === undefined;

  // Restore user session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("currentUser");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          if (parsedUser.requirePasswordChange) {
            setShowPasswordChange(true);
          }
        } catch (e) {
          console.error("Failed to parse saved user:", e);
          localStorage.removeItem("currentUser");
        }
      }
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
    }
    if (loggedInUser.requirePasswordChange) {
      setShowPasswordChange(true);
    }
  };

  const handlePasswordChanged = () => {
    setShowPasswordChange(false);
    if (user) {
      const updatedUser = { ...user, requirePasswordChange: false };
      setUser(updatedUser);
      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowPasswordChange(false);
    setActiveTab("calendar");
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
    }
  };

  const addToast = (notification: Omit<ToastNotification, "id">) => {
    const toast: ToastNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36),
    };
    setToasts((prev) => [...prev, toast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Example: Show desktop notification on important events
  useEffect(() => {
    if (user && isDesktop) {
      // This is an example - you can trigger toasts on various events
      // For now, we'll show a welcome toast
      const hasShownWelcome = sessionStorage.getItem("welcomeToastShown");
      if (!hasShownWelcome) {
        addToast({
          title: "Welcome!",
          titleTh: "ยินดีต้อนรับ!",
          message: "You're now connected to the Class Tracker system.",
          messageTh: "คุณเชื่อมต่อกับระบบติดตามชั้นเรียนแล้ว",
          type: "success",
        });
        sessionStorage.setItem("welcomeToastShown", "true");
      }
    }
  }, [user, isDesktop]);

  // Show loading state while checking database
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            {t("Loading...", "กำลังโหลด...")}
          </p>
        </div>
      </div>
    );
  }

  // Show init screen if no users exist
  if (needsInit) {
    return <DatabaseInit />;
  }

  if (!user) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen p-8">
      {/* Toast Notifications */}
      <ToastContainer notifications={toasts} onDismiss={dismissToast} />

      {showPasswordChange && (
        <PasswordChangeDialog
          userId={user._id}
          onPasswordChanged={handlePasswordChanged}
          canSkip={false}
        />
      )}

      <header className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {t("Class Tracker", "ติดตามชั้นเรียน")}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t(`Welcome, ${user.username}`, `ยินดีต้อนรับ, ${user.username}`)}
              {" · "}
              {t(
                user.role.charAt(0).toUpperCase() + user.role.slice(1),
                user.role === "teacher"
                  ? "ครู"
                  : user.role === "moderator"
                    ? "ผู้ดูแล"
                    : "ผู้จัดการ"
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Admin Contact Button for non-admin users */}
            {user.role !== "admin" && (
              <AdminContactButton currentUserId={user._id} />
            )}
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              {t("Logout", "ออกจากระบบ")}
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "calendar"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <CalendarDays className="w-5 h-5" />
            {t("Calendar", "ปฏิทิน")}
          </button>

          <button
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "classes"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Calendar className="w-5 h-5" />
            {t("Class Bookings", "การจองชั้นเรียน")}
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "messages"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <MessageSquare className="w-5 h-5" />
            {t("Messages", "ข้อความ")}
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "notifications"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Bell className="w-5 h-5" />
            {t("Notifications", "การแจ้งเตือน")}
          </button>

          {user.role === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("schools")}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "schools"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Building2 className="w-5 h-5" />
                {t("Schools", "โรงเรียน")}
              </button>

              <button
                onClick={() => setActiveTab("students")}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "students"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <GraduationCap className="w-5 h-5" />
                {t("Students", "นักเรียน")}
              </button>

              <button
                onClick={() => setActiveTab("moderators")}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "moderators"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Shield className="w-5 h-5" />
                {t("Moderators", "ผู้ดูแล")}
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "users"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Users className="w-5 h-5" />
                {t("Users", "ผู้ใช้")}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "calendar" && (
        <WeeklyCalendar currentUser={user} />
      )}

      {activeTab === "classes" && (
        <ClassBooking userId={user._id} userRole={user.role} />
      )}

      {activeTab === "messages" && (
        <MessagingHub currentUser={user} />
      )}

      {activeTab === "notifications" && (
        <>
          {user.role === "admin" && <NotificationForm />}
          <NotificationList />
        </>
      )}

      {activeTab === "schools" && user.role === "admin" && (
        <SchoolManagement />
      )}

      {activeTab === "students" && user.role === "admin" && (
        <StudentManagement />
      )}

      {activeTab === "moderators" && user.role === "admin" && (
        <ModeratorListView />
      )}

      {activeTab === "users" && user.role === "admin" && (
        <UserManagement />
      )}
    </div>
  );
}
