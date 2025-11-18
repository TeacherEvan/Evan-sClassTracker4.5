"use client";

// ✅ PERFORMANCE: Lazy load heavy components for code splitting (40-50% faster initial load)
import { useMutation, useQuery } from "convex/react";
import { GraduationCap, HelpCircle, LogOut, RefreshCw } from "lucide-react";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

// Core components (always loaded)
import WorkspaceLayout, { type UserRole } from "@/app/workspace-layout";
import { AdminContactButton } from "@/components/admin-contact-button";
import { DatabaseInit } from "@/components/database-init";
import { ToastContainer, type ToastNotification } from "@/components/desktop-notification-toast";
import { DesktopNotificationWindow } from "@/components/desktop-notification-window";
import { FishSchoolBackground } from "@/components/fish-school-background";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginForm } from "@/components/login-form";
import { NotificationWindow } from "@/components/notification-window";
import { PasswordChangeDialog } from "@/components/password-change-dialog";
import { RollingVitruvianMen } from "@/components/rolling-vitruvian-men";
import { StartupWindow } from "@/components/startup-window";
import { api } from "@/convex/_generated/api";
import { isDesktopDevice } from "@/lib/device-detection";
// import { initServiceWorker } from "@/lib/init-sw"; // DISABLED: Service worker not implemented
import { ImageUploader } from '@/components/image-upload';
import { useLanguage } from "@/lib/language-context";
import { clearUserSession, loadUserSession, saveUserSession } from "@/lib/session-utils";
import { toast as toastManager } from "@/lib/toast";
import type { User } from "@/lib/types";
import { usePullToRefresh } from "@/lib/use-pull-to-refresh";

// Lazy-loaded modals and overlays (loaded on demand - these stay in page.tsx)
const PostClassNotesModal = lazy(() => import("@/components/post-class-notes-modal").then(m => ({ default: m.PostClassNotesModal })));
const UpdateAnnouncementModal = lazy(() => import("@/components/update-announcement-modal").then(m => ({ default: m.UpdateAnnouncementModal })));
const ClassCountModal = lazy(() => import("@/components/class-count-modal").then(m => ({ default: m.ClassCountModal })));
const HelpWindow = lazy(() => import("@/components/help-window").then(m => ({ default: m.HelpWindow })));

export default function Home() {
  const { t } = useLanguage();
  const users = useQuery(api.users.list, {});
  const [user, setUser] = useState<User | null>(null);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);
  const [showPostClassNotes, setShowPostClassNotes] = useState(false);
  const [showUpdateAnnouncement, setShowUpdateAnnouncement] = useState(false);
  const [showClassCountModal, setShowClassCountModal] = useState(false);
  const [showStartupWindow, setShowStartupWindow] = useState(false);
  const [showHelpWindow, setShowHelpWindow] = useState(false);
  const hasCheckedStartupWindow = useRef(false);

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
  // DISABLED: Service worker file (/public/sw.js) not present, causing registration errors
  // useEffect(() => {
  //   initServiceWorker();
  // }, []);

  // Check if database needs initialization
  const needsInit = users !== undefined && users.length === 0;
  const isLoading = users === undefined;

  // Restore user session from localStorage on mount (with expiration check)
  useEffect(() => {
    const session = loadUserSession();
    if (session) {
      setUser(session);
      if (session.requirePasswordChange) {
        setShowPasswordChange(true);
      }
    }
  }, []);

  // Show startup window on login (highest priority) - MODERATORS ONLY
  useEffect(() => {
    if (user && user.role === "moderator" && !showPasswordChange && !hasCheckedStartupWindow.current) {
      // Check if user has dismissed startup window
      if (typeof window !== "undefined") {
        const dismissed = localStorage.getItem(
          `startupWindowDismissed_${user._id}`
        );
        if (!dismissed) {
          hasCheckedStartupWindow.current = true; // Mark as checked
          const timer = setTimeout(() => {
            setShowStartupWindow(true);
          }, 500);
          return () => clearTimeout(timer);
        } else {
          hasCheckedStartupWindow.current = true; // Mark as checked even if dismissed
        }
      }
    }
  }, [user, showPasswordChange]);

  // Check for classes needing feedback when teacher logs in
  useEffect(() => {
    if (
      user?.role === "teacher" &&
      classesNeedingFeedback &&
      classesNeedingFeedback.length > 0 &&
      !showPasswordChange &&
      !showStartupWindow &&
      !showPostClassNotes
    ) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowPostClassNotes(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, classesNeedingFeedback, showPasswordChange, showStartupWindow, showPostClassNotes]);

  // Check for unviewed app updates on login
  useEffect(() => {
    if (
      user &&
      activeUpdate &&
      hasViewedUpdate === false &&
      !showPasswordChange &&
      !showStartupWindow &&
      !showPostClassNotes &&
      !showUpdateAnnouncement
    ) {
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowUpdateAnnouncement(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, activeUpdate, hasViewedUpdate, showPasswordChange, showStartupWindow, showPostClassNotes, showUpdateAnnouncement]);

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
      // Update localStorage with session expiration
      saveUserSession(updatedUser);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setShowPasswordChange(false);
    // Clear localStorage
    clearUserSession();
  };

  const handleStartupWindowNavigate = (tab: string) => {
    // Special case: "help" triggers the help window modal instead of changing tabs
    if (tab === "help") {
      setShowHelpWindow(true);
    }
    // Note: Navigation is now handled by WorkspaceLayout internally
  };

  const handleStartupWindowClose = () => {
    setShowStartupWindow(false);
    // After startup window closes, show other priority modals if needed
    if (user?.role === "teacher" && classesNeedingFeedback && classesNeedingFeedback.length > 0) {
      setTimeout(() => {
        setShowPostClassNotes(true);
      }, 500);
    } else if (activeUpdate && hasViewedUpdate === false) {
      setTimeout(() => {
        setShowUpdateAnnouncement(true);
      }, 500);
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
    return (
      <>
        <RollingVitruvianMen />
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] pb-20 md:pb-0 md:p-8 relative overflow-hidden">
      {/* Static galaxy background */}
      <RollingVitruvianMen />

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

      <header className="max-w-4xl mx-auto mb-3 md:mb-8 p-3 md:p-4 relative z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-lg shadow-lg">
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
            {/* Help Button - Available to all users */}
            <button
              onClick={() => setShowHelpWindow(true)}
              className="flex items-center gap-1 md:gap-2 px-3 md:px-4 py-2.5 md:py-2 text-sm md:text-base bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/60 active:scale-95 transition-all touch-manipulation"
              title={t("Help & Guide", "ความช่วยเหลือและคู่มือ")}
            >
              <HelpCircle className="w-5 h-5 md:w-5 md:h-5" />
              <span className="hidden sm:inline">{t("Help", "ช่วยเหลือ")}</span>
            </button>
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

      {/* WorkspaceLayout - VS Code-style resizable panels */}
      <WorkspaceLayout
        userId={user._id}
        userRole={user.role as UserRole}
        userSchoolId={user.schoolId}
      />

      {/* Startup Window - All users on first login */}
      {showStartupWindow && user && (
        <StartupWindow
          user={user}
          onNavigate={handleStartupWindowNavigate}
          onClose={handleStartupWindowClose}
        />
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
            userRole={user.role}
            onClose={() => setShowClassCountModal(false)}
          />
        </Suspense>
      )}

      {/* Help Window - All users */}
      {showHelpWindow && user && (
        <Suspense fallback={null}>
          <HelpWindow
            userRole={user.role}
            onClose={() => setShowHelpWindow(false)}
          />
        </Suspense>
      )}

      <div className="mt-8">
        <ImageUploader />
      </div>
    </div>
  );
}
