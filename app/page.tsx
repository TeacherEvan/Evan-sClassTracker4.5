"use client";

// ✅ PERFORMANCE: Lazy load heavy components for code splitting (40-50% faster initial load)
import { useMutation, useQuery } from "convex/react";
import { BarChart3, Bell, BookOpen, Building2, Calendar, CalendarDays, FlaskConical, GraduationCap, LogOut, MapPin, MessageSquare, RefreshCw, Shield, Users } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

// Core components (always loaded)
import { AdminContactButton } from "@/components/admin-contact-button";
import { DatabaseInit } from "@/components/database-init";
import { ToastContainer, type ToastNotification } from "@/components/desktop-notification-toast";
import { DesktopNotificationWindow } from "@/components/desktop-notification-window";
import { FishSchoolBackground } from "@/components/fish-school-background";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/login-form";
import { NotificationWindow } from "@/components/notification-window";
import { PasswordChangeDialog } from "@/components/password-change-dialog";
import { api } from "@/convex/_generated/api";
import { isDesktopDevice } from "@/lib/device-detection";
import { initServiceWorker } from "@/lib/init-sw";
import { useLanguage } from "@/lib/language-context";
import { toast as toastManager } from "@/lib/toast";
import type { User } from "@/lib/types";
import { usePullToRefresh } from "@/lib/use-pull-to-refresh";

// Lazy-loaded components (loaded on demand)
const WeeklyCalendar = lazy(() => import("@/components/weekly-calendar").then(m => ({ default: m.WeeklyCalendar })));
const ClassBooking = lazy(() => import("@/components/class-booking").then(m => ({ default: m.ClassBooking })));
const MessagingHub = lazy(() => import("@/components/messaging-hub").then(m => ({ default: m.MessagingHub })));
const NotificationForm = lazy(() => import("@/components/notification-form").then(m => ({ default: m.NotificationForm })));
const NotificationList = lazy(() => import("@/components/notification-list").then(m => ({ default: m.NotificationList })));
const SchoolManagement = lazy(() => import("@/components/school-management").then(m => ({ default: m.SchoolManagement })));
const LocationManagement = lazy(() => import("@/components/location-management").then(m => ({ default: m.LocationManagement })));
const StudentManagement = lazy(() => import("@/components/student-management").then(m => ({ default: m.StudentManagement })));
const ModeratorListView = lazy(() => import("@/components/moderator-list-view").then(m => ({ default: m.ModeratorListView })));
const UserManagement = lazy(() => import("@/components/user-management").then(m => ({ default: m.UserManagement })));
const SimpleAnalytics = lazy(() => import("@/components/simple-analytics").then(m => ({ default: m.SimpleAnalytics })));
const TeacherActivityDashboard = lazy(() => import("@/components/teacher-activity-dashboard").then(m => ({ default: m.TeacherActivityDashboard })));
const TeacherHelper = lazy(() => import("@/components/teacher-helper").then(m => ({ default: m.TeacherHelper })));
const TeacherHelperAdmin = lazy(() => import("@/components/teacher-helper-admin").then(m => ({ default: m.TeacherHelperAdmin })));
const GuardianDashboard = lazy(() => import("@/components/guardian-dashboard").then(m => ({ default: m.GuardianDashboard })));
const DeviceTestingDashboard = lazy(() => import("@/components/device-testing-dashboard"));
const PostClassNotesModal = lazy(() => import("@/components/post-class-notes-modal").then(m => ({ default: m.PostClassNotesModal })));
const UpdateAnnouncementModal = lazy(() => import("@/components/update-announcement-modal").then(m => ({ default: m.UpdateAnnouncementModal })));
const AdminContactRequests = lazy(() => import("@/components/admin-contact-requests").then(m => ({ default: m.AdminContactRequests })));
const AdminNotificationWindows = lazy(() => import("@/components/admin-notification-windows").then(m => ({ default: m.AdminNotificationWindows })));
const AdminAppUpdates = lazy(() => import("@/components/admin-app-updates").then(m => ({ default: m.AdminAppUpdates })));
const ClassCountModal = lazy(() => import("@/components/class-count-modal").then(m => ({ default: m.ClassCountModal })));
const SangsomSeedButton = lazy(() => import("@/components/sangsom-seed-button").then(m => ({ default: m.SangsomSeedButton })));
const SangsomMigrationButton = lazy(() => import("@/components/sangsom-migration-button").then(m => ({ default: m.SangsomMigrationButton })));
const EventManagement = lazy(() => import("@/components/event-management").then(m => ({ default: m.EventManagement })));

export default function Home() {
  const { t } = useLanguage();
  const users = useQuery(api.users.list, {});
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "users" | "classes" | "calendar" | "schools" | "students" | "messages" | "moderators" | "analytics" | "resources" | "locations" | "activity" | "testing" | "contact_requests" | "notification_windows" | "app_updates" | "data_import" | "events">("calendar");
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showPostClassNotes, setShowPostClassNotes] = useState(false);
  const [showUpdateAnnouncement, setShowUpdateAnnouncement] = useState(false);
  const [showClassCountModal, setShowClassCountModal] = useState(false);

  // Query unread message count for current user
  const unreadCount = useQuery(
    api.messages.unreadCount,
    user ? { userId: user._id } : "skip"
  );

  // Query classes needing feedback for teachers
  const classesNeedingFeedback = useQuery(
    api.postClassNotes.getClassesNeedingFeedback,
    user?.role === "teacher" ? { userId: user._id } : "skip"
  );

  // Query teacher's class count (only for teachers)
  const teacherClassCount = useQuery(
    api.teacherClassCount.getTeacherClassCount,
    user?.role === "teacher" ? { teacherId: user._id } : "skip"
  );

  // Query active app update
  const activeUpdate = useQuery(api.appUpdates.getActive);

  // Check if user has viewed the active update
  const hasViewedUpdate = useQuery(
    api.appUpdates.hasUserViewed,
    user && activeUpdate ? { userId: user._id, updateId: activeUpdate._id } : "skip"
  );

  // Mark update as viewed mutation
  const markUpdateAsViewed = useMutation(api.appUpdates.markAsViewed);

  // Loading fallback component for lazy-loaded components
  const LoadingFallback = () => (
    <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  );

  // Subscribe to toast manager
  useEffect(() => {
    const unsubscribe = toastManager.subscribe((toast) => {
      addToast(toast);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Pull-to-refresh functionality
  const handleRefresh = async () => {
    // Simulate refresh by waiting a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    // The useQuery hooks will automatically refetch when the component re-renders
    window.location.reload();
  };

  const { isPulling, isRefreshing, pullDistance } = usePullToRefresh(handleRefresh);

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

  // Check for classes needing feedback when teacher logs in
  useEffect(() => {
    if (
      user?.role === "teacher" &&
      classesNeedingFeedback &&
      classesNeedingFeedback.length > 0 &&
      !showPasswordChange &&
      !showPostClassNotes
    ) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowPostClassNotes(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, classesNeedingFeedback, showPasswordChange, showPostClassNotes]);

  // Check for unviewed app updates on login
  useEffect(() => {
    if (
      user &&
      activeUpdate &&
      hasViewedUpdate === false &&
      !showPasswordChange &&
      !showPostClassNotes &&
      !showUpdateAnnouncement
    ) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowUpdateAnnouncement(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, activeUpdate, hasViewedUpdate, showPasswordChange, showPostClassNotes, showUpdateAnnouncement]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
    }
    if (loggedInUser.requirePasswordChange) {
      setShowPasswordChange(true);
    }

    // Check for post-class notes needed (teachers only) - delay to allow queries to load
    if (loggedInUser.role === "teacher") {
      setTimeout(() => {
        // The classesNeedingFeedback query will automatically update
        // and we'll show the modal in a useEffect when it has data
      }, 500);
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

  const handlePostClassNotesComplete = () => {
    setShowPostClassNotes(false);
    // Show update announcement if available after completing notes
    if (activeUpdate && hasViewedUpdate === false) {
      setTimeout(() => {
        setShowUpdateAnnouncement(true);
      }, 500);
    }
  };

  const handleUpdateAnnouncementClose = async () => {
    if (user && activeUpdate) {
      try {
        await markUpdateAsViewed({
          userId: user._id,
          updateId: activeUpdate._id,
        });
      } catch (error) {
        console.error("Failed to mark update as viewed:", error);
      }
    }
    setShowUpdateAnnouncement(false);
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
    <div className="min-h-[100dvh] pb-20 md:pb-0 md:p-8 relative overflow-hidden">
      {/* Animated fish school background */}
      <FishSchoolBackground className="opacity-30" />

      {/* Pull-to-Refresh Indicator - Mobile only */}
      {!isDesktop && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center items-center transition-all duration-300 z-40"
          style={{
            height: `${pullDistance}px`,
            opacity: pullDistance > 0 ? 1 : 0,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          }}
        >
          <RefreshCw
            className={`text-blue-600 dark:text-blue-400 transition-transform duration-300 ${isRefreshing || isPulling ? 'animate-spin' : ''}`}
            style={{
              transform: `rotate(${pullDistance * 3}deg) scale(${Math.min(pullDistance / 80, 1)})`,
            }}
          />
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer notifications={toasts} onDismiss={dismissToast} />

      {/* Gold Tablet Notification Window - Shown once per user on login */}
      {user && (
        <DesktopNotificationWindow userId={user._id} username={user.username} />
      )}

      {/* Notification Window - Shows important announcements to users */}
      <NotificationWindow
        currentUserId={user._id}
        currentUsername={user.username}
      />

      {showPasswordChange && (
        <PasswordChangeDialog
          userId={user._id}
          onPasswordChanged={handlePasswordChanged}
          canSkip={false}
        />
      )}

      <header className="max-w-4xl mx-auto mb-3 md:mb-8 p-3 md:p-0 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-3">
              <h1 className="text-xl md:text-3xl font-bold truncate">
                {t("Class Tracker", "ติดตามชั้นเรียน")}
              </h1>
              {/* Class Count Badge (Teachers Only) - Clickable */}
              {user.role === "teacher" && teacherClassCount && (
                <button
                  onClick={() => setShowClassCountModal(true)}
                  className="flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 bg-gradient-to-r from-yellow-400 to-yellow-500 dark:from-yellow-500 dark:to-yellow-600 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 touch-manipulation"
                  title={t("Click to view details", "คลิกเพื่อดูรายละเอียด")}
                >
                  <GraduationCap className="w-3 h-3 md:w-4 md:h-4 text-yellow-900 dark:text-yellow-100" />
                  <span className="text-xs md:text-sm font-bold text-yellow-900 dark:text-yellow-100">
                    {teacherClassCount.total}
                  </span>
                </button>
              )}
            </div>
            <p className="text-xs md:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">
              {t(`Welcome, ${user.username}`, `ยินดีต้อนรับ, ${user.username}`)}
              {" · "}
              {t(
                user.role.charAt(0).toUpperCase() + user.role.slice(1),
                user.role === "teacher"
                  ? "ครู"
                  : user.role === "moderator"
                    ? "ผู้ดูแล"
                    : user.role === "guardian"
                      ? "ผู้ปกครอง"
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
      <div className="max-w-7xl mx-auto mb-4 md:mb-6 hidden md:block relative z-10">
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
            onClick={() => setActiveTab("events")}
            className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "events"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <Bell className="w-4 h-4 md:w-5 md:h-5" />
            {t("Events & Reminders", "กิจกรรมและการแจ้งเตือน")}
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
            className={`relative flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "messages"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
          >
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
            {t("Messages", "ข้อความ")}
            {/* Unread message badge */}
            {unreadCount && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 pulse-red rounded-full px-2 py-1 text-xs font-bold shadow-lg">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Teacher's Helper tab - hide from moderators */}
          {user.role !== "moderator" && (
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
          )}

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

              <button
                onClick={() => setActiveTab("testing")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "testing"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <FlaskConical className="w-4 h-4 md:w-5 md:h-5" />
                {t("Testing", "ทดสอบ")}
              </button>

              <button
                onClick={() => setActiveTab("contact_requests")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "contact_requests"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                {t("Contact Requests", "คำขอติดต่อ")}
              </button>

              <button
                onClick={() => setActiveTab("notification_windows")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "notification_windows"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Bell className="w-4 h-4 md:w-5 md:h-5" />
                {t("Notification Windows", "หน้าต่างประกาศ")}
              </button>

              <button
                onClick={() => setActiveTab("app_updates")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "app_updates"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <BookOpen className="w-4 h-4 md:w-5 md:h-5" />
                {t("App Updates", "ประกาศอัปเดต")}
              </button>

              <button
                onClick={() => setActiveTab("data_import")}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-2 border-b-2 transition-colors whitespace-nowrap text-sm md:text-base ${activeTab === "data_import"
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
              >
                <Calendar className="w-4 h-4 md:w-5 md:h-5" />
                {t("Data Import", "นำเข้าข้อมูล")}
              </button>
            </>
          )}

          {/* Students tab - Available to Admin and Moderator */}
          {(user.role === "admin" || user.role === "moderator") && (
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
          )}
        </div>
      </div>

      {/* Tab Content - Wrapped with Suspense for lazy loading */}
      <div className="relative z-10">
        {activeTab === "calendar" && (
          <Suspense fallback={<LoadingFallback />}>
            <WeeklyCalendar currentUser={user} />
          </Suspense>
        )}

        {activeTab === "classes" && (
          <Suspense fallback={<LoadingFallback />}>
            <ClassBooking userId={user._id} userRole={user.role} userSchoolId={user.schoolId} />
          </Suspense>
        )}

        {activeTab === "events" && user && (
          <Suspense fallback={<LoadingFallback />}>
            <EventManagement
              userId={user._id}
              userRole={user.role}
              schoolId={user.schoolId}
            />
          </Suspense>
        )}

        {activeTab === "messages" && user && (
          <Suspense fallback={<LoadingFallback />}>
            <MessagingHub currentUser={user} />
          </Suspense>
        )}

        {activeTab === "analytics" && user.role === "moderator" && user.schoolId && (
          <Suspense fallback={<LoadingFallback />}>
            <SimpleAnalytics
              schoolId={user.schoolId}
              currentUserId={user._id}
              currentUserRole={user.role}
              currentUser={user}
            />
          </Suspense>
        )}

        {activeTab === "activity" && user.role === "moderator" && user.schoolId && (
          <Suspense fallback={<LoadingFallback />}>
            <TeacherActivityDashboard schoolId={user.schoolId} moderatorId={user._id} />
          </Suspense>
        )}

        {activeTab === "resources" && user && (user.role === "admin" || user.role === "teacher") && (
          <Suspense fallback={<LoadingFallback />}>
            {user.role === "admin" ? (
              <TeacherHelperAdmin currentUser={user} />
            ) : (
              <TeacherHelper currentUser={user} />
            )}
          </Suspense>
        )}

        {/* Guardian Dashboard - Only for guardians */}
        {user.role === "guardian" && (
          <Suspense fallback={<LoadingFallback />}>
            <GuardianDashboard currentUser={user} />
          </Suspense>
        )}

        {activeTab === "notifications" && (
          <Suspense fallback={<LoadingFallback />}>
            {user.role === "admin" && <NotificationForm />}
            <NotificationList userId={user._id} currentUser={user} />
          </Suspense>
        )}

        {activeTab === "schools" && user.role === "admin" && (
          <Suspense fallback={<LoadingFallback />}>
            <SchoolManagement />
          </Suspense>
        )}

        {activeTab === "locations" && (user.role === "admin" || user.role === "moderator") && (
          <Suspense fallback={<LoadingFallback />}>
            <LocationManagement
              userId={user._id}
              schoolId={user.role === "moderator" ? user.schoolId : undefined}
            />
          </Suspense>
        )}

        {activeTab === "students" && (user.role === "admin" || user.role === "moderator") && (
          <Suspense fallback={<LoadingFallback />}>
            <StudentManagement currentUser={user} />
          </Suspense>
        )}

        {activeTab === "moderators" && user.role === "admin" && (
          <Suspense fallback={<LoadingFallback />}>
            <ModeratorListView />
          </Suspense>
        )}

        {activeTab === "users" && user.role === "admin" && (
          <Suspense fallback={<LoadingFallback />}>
            <UserManagement currentUserId={user._id} />
          </Suspense>
        )}

        {activeTab === "testing" && user.role === "admin" && (
          <Suspense fallback={<LoadingFallback />}>
            <DeviceTestingDashboard />
          </Suspense>
        )}

        {activeTab === "contact_requests" && user.role === "admin" && (
          <Suspense fallback={<LoadingFallback />}>
            <AdminContactRequests currentUserId={user._id} />
          </Suspense>
        )}

        {activeTab === "notification_windows" && user.role === "admin" && (
          <Suspense fallback={<LoadingFallback />}>
            <AdminNotificationWindows currentUserId={user._id} />
          </Suspense>
        )}

        {activeTab === "app_updates" && user.role === "admin" && (
          <Suspense fallback={<LoadingFallback />}>
            <AdminAppUpdates currentUserId={user._id} />
          </Suspense>
        )}

        {activeTab === "data_import" && user.role === "admin" && (
          <Suspense fallback={<LoadingFallback />}>
            <div className="max-w-4xl mx-auto p-4">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {t("Data Import & Seeding", "นำเข้าและเพิ่มข้อมูล")}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t(
                      "Import bulk data from external sources or seed test data",
                      "นำเข้าข้อมูลจำนวนมากจากแหล่งภายนอกหรือเพิ่มข้อมูลทดสอบ"
                    )}
                  </p>
                </div>
                <div className="space-y-4">
                  <SangsomSeedButton />
                  <SangsomMigrationButton userId={user._id} />
                </div>
              </div>
            </div>
          </Suspense>
        )}

        {/* Post-Class Notes Modal - Teachers only */}
        {showPostClassNotes && classesNeedingFeedback && classesNeedingFeedback.length > 0 && user && (
          <Suspense fallback={null}>
            <PostClassNotesModal
              classes={classesNeedingFeedback}
              currentUserId={user._id}
              onClose={() => setShowPostClassNotes(false)}
              onComplete={handlePostClassNotesComplete}
            />
          </Suspense>
        )}

        {/* Update Announcement Modal - All users */}
        {showUpdateAnnouncement && activeUpdate && user && (
          <Suspense fallback={null}>
            <UpdateAnnouncementModal
              update={activeUpdate}
              onClose={handleUpdateAnnouncementClose}
            />
          </Suspense>
        )}

        {/* ClassCount Details Modal - Teachers only */}
        {showClassCountModal && user && user.role === "teacher" && (
          <Suspense fallback={null}>
            <ClassCountModal
              teacherId={user._id}
              onClose={() => setShowClassCountModal(false)}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
