"use client";

import { AdminContactButton } from "@/components/admin-contact-button";
import { ClassBooking } from "@/components/class-booking";
import { DatabaseInit } from "@/components/database-init";
import { ToastContainer, type ToastNotification } from "@/components/desktop-notification-toast";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocationManagement } from "@/components/location-management";
import { LoginForm } from "@/components/login-form";
import { MessagingHub } from "@/components/messaging-hub";
import { ModeratorListView } from "@/components/moderator-list-view";
import { NotificationForm } from "@/components/notification-form";
import { NotificationList } from "@/components/notification-list";
import { PasswordChangeDialog } from "@/components/password-change-dialog";
import { SchoolManagement } from "@/components/school-management";
import { SimpleAnalytics } from "@/components/simple-analytics";
import { StudentManagement } from "@/components/student-management";
import { TeacherActivityDashboard } from "@/components/teacher-activity-dashboard";
import { TeacherHelper } from "@/components/teacher-helper";
import { TeacherHelperAdmin } from "@/components/teacher-helper-admin";
import { UserManagement } from "@/components/user-management";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { api } from "@/convex/_generated/api";
import { isDesktopDevice } from "@/lib/device-detection";
import { initServiceWorker } from "@/lib/init-sw";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useQuery } from "convex/react";
import { BarChart3, Bell, BookOpen, Building2, Calendar, CalendarDays, GraduationCap, LogOut, MapPin, MessageSquare, Shield, Users } from "lucide-react";
import { useEffect, useState } from "react";

export default function Home() {
  const { t } = useLanguage();
  const users = useQuery(api.users.list, {});
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "users" | "classes" | "calendar" | "schools" | "students" | "messages" | "moderators" | "analytics" | "resources" | "locations" | "activity">("calendar");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  // Check device type on mount
  useEffect(() => {
    setIsDesktop(isDesktopDevice());
  }, []);

  // Register service worker for push notifications
  useEffect(() => {
    initServiceWorker();
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
      <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
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
    <div className="min-h-[100dvh] pb-20 md:pb-0 md:p-8">
      {/* Toast Notifications */}
      <ToastContainer notifications={toasts} onDismiss={dismissToast} />

      {showPasswordChange && (
        <PasswordChangeDialog
          userId={user._id}
          onPasswordChanged={handlePasswordChanged}
          canSkip={false}
        />
      )}

      <header className="max-w-4xl mx-auto mb-3 md:mb-8 p-3 md:p-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-3xl font-bold truncate">
              {t("Class Tracker", "ติดตามชั้นเรียน")}
            </h1>
            <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
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
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Admin Contact Button for non-admin users */}
            {user.role !== "admin" && (
              <AdminContactButton currentUserId={user._id} />
            )}
            <LanguageSwitcher />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-2 text-sm md:text-base bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all touch-manipulation"
            >
              <LogOut className="w-5 h-5 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{t("Logout", "ออกจากระบบ")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 md:hidden safe-area-inset-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-95 ${activeTab === "calendar"
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400"
              }`}
          >
            <CalendarDays className="w-6 h-6" />
            <span className="text-xs font-medium">{t("Calendar", "ปฏิทิน")}</span>
          </button>

          <button
            onClick={() => setActiveTab("classes")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-95 ${activeTab === "classes"
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400"
              }`}
          >
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">{t("Classes", "ชั้นเรียน")}</span>
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-95 ${activeTab === "messages"
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400"
              }`}
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs font-medium">{t("Messages", "ข้อความ")}</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all touch-manipulation active:scale-95 ${activeTab === "notifications"
              ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "text-gray-600 dark:text-gray-400"
              }`}
          >
            <Bell className="w-6 h-6" />
            <span className="text-xs font-medium">{t("Alerts", "แจ้งเตือน")}</span>
          </button>
        </div>
      </nav>

      {/* Desktop Tab Navigation - Hidden on mobile */}
      <div className="max-w-7xl mx-auto mb-4 md:mb-6 hidden md:block">
        <div className="flex gap-1 md:gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab("calendar")}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "calendar"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <CalendarDays className="w-4 h-4 md:w-5 md:h-5" />
            {t("Calendar", "ปฏิทิน")}
          </button>

          <button
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "classes"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Calendar className="w-4 h-4 md:w-5 md:h-5" />
            {user.role === "teacher"
              ? t("Class Requests", "คำขอชั้นเรียน")
              : t("Class Bookings", "การจองชั้นเรียน")}
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "messages"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
            {t("Messages", "ข้อความ")}
          </button>

          {/* Teacher's Helper tab - available to all users */}
          <button
            onClick={() => setActiveTab("resources")}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "resources"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
            {t("Teacher's Helper", "ผู้ช่วยครู")}
          </button>

          {/* Analytics tab for moderators */}
          {user.role === "moderator" && user.schoolId && (
            <>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "analytics"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                {t("Analytics", "การวิเคราะห์")}
              </button>

              <button
                onClick={() => setActiveTab("activity")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "activity"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                {t("Activity", "กิจกรรม")}
              </button>

              <button
                onClick={() => setActiveTab("locations")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "locations"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                {t("Locations", "สถานที่")}
              </button>
            </>
          )}

          <button
            onClick={() => setActiveTab("notifications")}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "notifications"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {t("Notifications", "การแจ้งเตือน")}
          </button>

          {user.role === "admin" && (
            <>
              <button
                onClick={() => setActiveTab("schools")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "schools"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Building2 className="w-4 h-4 md:w-5 md:h-5" />
                {t("Schools", "โรงเรียน")}
              </button>

              <button
                onClick={() => setActiveTab("locations")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "locations"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <MapPin className="w-4 h-4 md:w-5 md:h-5" />
                {t("Locations", "สถานที่")}
              </button>

              <button
                onClick={() => setActiveTab("students")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "students"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <GraduationCap className="w-4 h-4 md:w-5 md:h-5" />
                {t("Students", "นักเรียน")}
              </button>

              <button
                onClick={() => setActiveTab("moderators")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "moderators"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                {t("Moderators", "ผู้ดูแล")}
              </button>

              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "users"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Users className="w-4 h-4 md:w-5 md:h-5" />
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

      {activeTab === "messages" && user && (
        <MessagingHub currentUser={user} />
      )}

      {activeTab === "analytics" && user.role === "moderator" && user.schoolId && (
        <SimpleAnalytics schoolId={user.schoolId} />
      )}

      {activeTab === "activity" && user.role === "moderator" && user.schoolId && (
        <TeacherActivityDashboard schoolId={user.schoolId} moderatorId={user._id} />
      )}

      {activeTab === "resources" && user && (
        <>
          {user.role === "admin" ? (
            <TeacherHelperAdmin currentUser={user} />
          ) : (
            <TeacherHelper currentUser={user} />
          )}
        </>
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

      {activeTab === "locations" && (user.role === "admin" || user.role === "moderator") && (
        <LocationManagement
          userId={user._id}
          schoolId={user.role === "moderator" ? user.schoolId : undefined}
        />
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
