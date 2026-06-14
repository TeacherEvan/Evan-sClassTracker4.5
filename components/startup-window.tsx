"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { toast } from "@/lib/toast";
import type { User, UserRole } from "@/lib/types";
import { useMutation } from "convex/react";
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckSquare,
  Globe,
  LayoutDashboard,
  Send,
  Sparkles,
  Star,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { BookingWizard } from "./booking-wizard";
import { ClassAnalytics } from "./class-analytics";
import { ClassCountReportWizard } from "./class-count-report-wizard";
import { MessageWizard } from "./message-wizard";
import { ModeratorApprovalWizard } from "./moderator-approval-wizard";
import { TeacherQuickBookWizard } from "./teacher-quick-book-wizard";

interface StartupWindowProps {
  user: User;
  onNavigate: (tab: string) => void;
  onClose: () => void;
}

export function StartupWindow({
  user,
  onNavigate,
  onClose,
}: StartupWindowProps) {
  const { t, language, setLanguage } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Wizard states
  const [showBookingWizard, setShowBookingWizard] = useState(false);
  const [showClassCountWizard, setShowClassCountWizard] = useState(false);
  const [showMessageWizard, setShowMessageWizard] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showQuickBookWizard, setShowQuickBookWizard] = useState(false);
  const [showApprovalWizard, setShowApprovalWizard] = useState(false);

  // Mutation for creating bookings
  const bookClass = useMutation(api.classes.book);

  // Check if user has dismissed startup window
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem(
        `startupWindowDismissed_${user._id}`,
      );
      if (!dismissed) {
        // Don't force language - let user choose
        setIsVisible(true);
      }
    }
  }, [user._id, user.role]);

  const handleClose = (dontShowAgain: boolean = false) => {
    setIsClosing(true);
    setTimeout(() => {
      if (dontShowAgain && typeof window !== "undefined") {
        localStorage.setItem(`startupWindowDismissed_${user._id}`, "true");
      }
      setIsVisible(false);
      setIsClosing(false);
      onClose();
    }, 500);
  };

  const handleOptionClick = (tab: string) => {
    // Handle wizard flows
    if (tab === "booking-wizard") {
      setShowBookingWizard(true);
      return;
    }
    if (tab === "quick-book-wizard") {
      setShowQuickBookWizard(true);
      return;
    }
    if (tab === "approval-wizard") {
      setShowApprovalWizard(true);
      return;
    }
    if (tab === "class-count-wizard") {
      setShowClassCountWizard(true);
      return;
    }
    if (tab === "message-wizard") {
      setShowMessageWizard(true);
      return;
    }
    if (tab === "analytics-wizard") {
      setShowAnalytics(true);
      return;
    }

    handleClose(false);
    onNavigate(tab);
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "th" : "en");
  };

  if (!isVisible) return null;

  // Personalized greeting based on role
  const getGreeting = () => {
    switch (user.role) {
      case "admin":
        return {
          en: `Welcome ${user.username}`,
          th: `ยินดีต้อนรับ ${user.username}`,
          subtitle_en: "You have full system access",
          subtitle_th: "คุณมีสิทธิ์เข้าถึงระบบทั้งหมด",
        };
      case "moderator":
        return {
          en: "Welcome Boss",
          th: "ยินดีต้อนรับ บอส",
          subtitle_en: "Manage your school effectively",
          subtitle_th: "จัดการโรงเรียนของคุณอย่างมีประสิทธิภาพ",
        };
      case "teacher":
        return {
          en: "Welcome Teacher",
          th: "ยินดีต้อนรับ ครู",
          subtitle_en: "Ready to teach today?",
          subtitle_th: "พร้อมสอนวันนี้หรือยัง?",
        };
      default:
        return {
          en: "Welcome",
          th: "ยินดีต้อนรับ",
          subtitle_en: "Get started with Class Tracker",
          subtitle_th: "เริ่มใช้งาน Class Tracker",
        };
    }
  };

  const greeting = getGreeting();
  const displayGreeting = language === "en" ? greeting.en : greeting.th;
  const displaySubtitle =
    language === "en" ? greeting.subtitle_en : greeting.subtitle_th;

  // Menu options type
  type MenuOption = {
    id: string;
    tab: string;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    hoverColor: string;
    disabled?: boolean;
    roles?: UserRole[]; // Which roles can see this option
  };

  // Menu options
  const menuOptions: MenuOption[] = [
    {
      id: "book-wizard",
      tab: "booking-wizard",
      icon: BookOpen,
      title: t("Book a Class", "จองคลาส"),
      description: t(
        "Step-by-step class booking wizard",
        "ตัวช่วยจองคลาสทีละขั้นตอน",
      ),
      color: "from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
      roles: ["moderator", "teacher"],
    },
    {
      id: "quick-book",
      tab: "quick-book-wizard",
      icon: Zap,
      title: t("Quick Book", "จองด่วน"),
      description: t("Rebook recent classes instantly", "จองคลาสล่าสุดทันที"),
      color: "from-yellow-500 to-orange-500",
      hoverColor: "hover:from-yellow-600 hover:to-orange-600",
      roles: ["teacher"],
    },
    {
      id: "approval-wizard",
      tab: "approval-wizard",
      icon: CheckSquare,
      title: t("Quick Approvals", "อนุมัติด่วน"),
      description: t(
        "Review and approve pending bookings",
        "ตรวจสอบและอนุมัติการจองที่รอดำเนินการ",
      ),
      color: "from-green-500 to-emerald-600",
      hoverColor: "hover:from-green-600 hover:to-emerald-700",
      roles: ["moderator"],
    },
    {
      id: "class-count-report",
      tab: "class-count-wizard",
      icon: BarChart3,
      title: t("Class Count Report", "รายงาน ClassCount"),
      description: t(
        "Select teacher → Select date → View/Print",
        "เลือกครู → เลือกวันที่ → ดู/พิมพ์",
      ),
      color: "from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
      roles: ["moderator", "teacher"],
    },
    {
      id: "message-teacher",
      tab: "message-wizard",
      icon: Send,
      title: t("Message Teacher/User", "ส่งข้อความถึงครู"),
      description: t(
        "Select teacher(s) → Message → Status → Dashboard",
        "เลือกครู → ข้อความ → สถานะ → แดชบอร์ด",
      ),
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
      roles: ["moderator", "teacher"],
    },
    {
      id: "create-notification",
      tab: "notifications",
      icon: Bell,
      title: t("Create EVENT/Notification", "สร้างอีเว้นท์/การแจ้งเตือน"),
      description: t(
        "Go to notifications/events window",
        "ไปที่หน้าต่างการแจ้งเตือน/อีเว้นท์",
      ),
      color: "from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
      roles: ["moderator", "teacher"],
    },
    {
      id: "dashboard",
      tab: "calendar",
      icon: LayoutDashboard,
      title: t("Proceed to Dashboard", "ไปที่แดชบอร์ด"),
      description: t(
        "Go to your default dashboard",
        "ไปที่แดชบอร์ดเริ่มต้นของคุณ",
      ),
      color: "from-gray-500 to-gray-600",
      hoverColor: "hover:from-gray-600 hover:to-gray-700",
      roles: ["moderator", "teacher"],
    },
  ];

  // Filter options based on user role
  const filteredOptions = menuOptions.filter((option) => {
    // If no roles specified, show to everyone
    if (!option.roles || option.roles.length === 0) return true;
    // Otherwise, check if user's role is in the allowed roles
    return option.roles.includes(user.role);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      {/* Gold Tablet Container */}
      <div
        className={`relative max-w-4xl w-full max-h-[85vh] overflow-hidden rounded-3xl shadow-2xl transform transition-all duration-500 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        style={{
          background:
            "linear-gradient(135deg, #f6e05e 0%, #d69e2e 25%, #f6ad55 50%, #ed8936 75%, #dd6b20 100%)",
          boxShadow:
            "0 0 60px rgba(251, 191, 36, 0.6), 0 0 100px rgba(251, 191, 36, 0.4), inset 0 0 80px rgba(255, 255, 255, 0.2)",
        }}
      >
        {/* Shining overlay effect */}
        <div
          className="absolute inset-0 opacity-30 animate-shine"
          style={{
            background:
              "linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.8) 50%, transparent 70%)",
            backgroundSize: "200% 200%",
          }}
        />

        {/* Sparkle decorations */}
        <div className="absolute top-4 left-4 animate-pulse">
          <Sparkles className="w-6 h-6 text-yellow-100" />
        </div>
        <div className="absolute top-4 right-16 animate-pulse delay-150">
          <Star className="w-6 h-6 text-yellow-100" />
        </div>
        <div className="absolute bottom-4 left-8 animate-pulse delay-300">
          <Star className="w-5 h-5 text-yellow-100" />
        </div>
        <div className="absolute bottom-4 right-8 animate-pulse delay-500">
          <Sparkles className="w-5 h-5 text-yellow-100" />
        </div>

        {/* Content Container */}
        <div className="relative bg-gradient-to-br from-amber-50/95 to-orange-50/95 dark:from-amber-950/95 dark:to-orange-950/95 m-3 rounded-2xl shadow-inner overflow-y-auto max-h-[85vh]">
          {/* Header with language switcher and close button */}
          <div className="sticky top-0 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900 dark:to-orange-900 px-6 py-4 border-b-2 border-amber-300 dark:border-amber-700 flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-amber-600 dark:text-amber-400" />
              <div>
                <h2 className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {displayGreeting}
                </h2>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {displaySubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border-2 border-amber-300 dark:border-amber-700"
                aria-label={t("Switch Language", "สลับภาษา")}
              >
                <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-800 dark:text-amber-200">
                  {language === "en" ? "EN" : "TH"}
                </span>
              </button>
              {/* Close Button */}
              <button
                onClick={() => handleClose(false)}
                className="text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 transition-colors p-1"
                aria-label={t("Close", "ปิด")}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Welcome Message */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-lg border-2 border-amber-200 dark:border-amber-800">
              <p className="text-xl font-semibold text-amber-900 dark:text-amber-100 mb-2">
                {t("What would you like to do?", "คุณต้องการทำอะไร?")}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                {t(
                  "Choose an option below to get started quickly",
                  "เลือกตัวเลือกด้านล่างเพื่อเริ่มต้นอย่างรวดเร็ว",
                )}
              </p>
            </div>

            {/* Menu Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOptions.map((option, index) => {
                const Icon = option.icon;
                const isDisabled = option.disabled || false;

                return (
                  <button
                    key={option.id}
                    onClick={() => !isDisabled && handleOptionClick(option.tab)}
                    disabled={isDisabled}
                    className={`relative group text-left p-4 md:p-6 rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-2 border-white/50 dark:border-gray-800/50 ${
                      isDisabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
                      animationDelay: `${index * 50}ms`,
                    }}
                    aria-label={option.title}
                    aria-disabled={isDisabled}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${option.color} rounded-xl opacity-90 ${
                        !isDisabled && option.hoverColor
                      } transition-all duration-300`}
                    />
                    <div className="relative z-10">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-bold text-white">
                              {index + 1}. {option.title}
                            </h3>
                            {isDisabled && (
                              <span className="text-xs px-2 py-1 bg-white/30 rounded-full text-white">
                                {t("Coming Soon", "เร็วๆ นี้")}
                              </span>
                            )}
                          </div>
                          <p className="text-white/90 text-sm">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer with "Don't show again" option */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border-2 border-amber-200 dark:border-amber-800 flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t(
                  "Tip: You can always access these features from the main menu",
                  "เคล็ดลับ: คุณสามารถเข้าถึงฟีเจอร์เหล่านี้ได้จากเมนูหลักเสมอ",
                )}
              </p>
              <button
                onClick={() => handleClose(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200"
              >
                {t("Don't show again", "ไม่ต้องแสดงอีก")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Wizard Modals */}
      {showBookingWizard && (
        <BookingWizard
          key={`booking-wizard-${language}`}
          userId={user._id}
          userRole={user.role as "teacher" | "moderator"}
          userSchoolId={user.schoolId as Id<"schools"> | undefined}
          onComplete={async (data) => {
            try {
              // Determine the school ID based on user role
              const schoolId =
                user.role === "moderator"
                  ? (user.schoolId as Id<"schools">)
                  : undefined; // Teachers can book at any school, will be determined by student

              if (data.bookingType === "once-off" && data.selectedDate) {
                // Create single booking
                await bookClass({
                  teacherId: data.teacherId,
                  schoolId: schoolId,
                  studentId: data.studentId,
                  scheduledDate: data.selectedDate,
                  bookedByUserId: user._id,
                  duration: 60, // Default 1 hour
                  classType: "regular",
                });

                toast.success("Class booked successfully!", "จองคลาสสำเร็จ!");
              } else if (
                data.bookingType === "recurring" &&
                data.weeksCount &&
                data.selectedDays
              ) {
                // Create multiple recurring bookings
                const bookingPromises = [];
                const now = new Date();

                for (let week = 0; week < data.weeksCount; week++) {
                  for (const dayTime of data.selectedDays) {
                    // Calculate the date for this booking
                    const daysMap: { [key: string]: number } = {
                      Sunday: 0,
                      Monday: 1,
                      Tuesday: 2,
                      Wednesday: 3,
                      Thursday: 4,
                      Friday: 5,
                      Saturday: 6,
                      อาทิตย์: 0,
                      จันทร์: 1,
                      อังคาร: 2,
                      พุธ: 3,
                      พฤหัสบดี: 4,
                      ศุกร์: 5,
                      เสาร์: 6,
                    };

                    const targetDayOfWeek = daysMap[dayTime.day];
                    const currentDayOfWeek = now.getDay();
                    let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;
                    if (daysUntilTarget < 0) daysUntilTarget += 7;

                    const bookingDate = new Date(now);
                    bookingDate.setDate(
                      now.getDate() + daysUntilTarget + week * 7,
                    );

                    // Set time from dayTime.time (format: "HH:MM")
                    const [hours, minutes] = dayTime.time
                      .split(":")
                      .map(Number);
                    bookingDate.setHours(hours, minutes, 0, 0);

                    bookingPromises.push(
                      bookClass({
                        teacherId: data.teacherId,
                        schoolId: schoolId,
                        studentId: data.studentId,
                        scheduledDate: bookingDate.getTime(),
                        bookedByUserId: user._id,
                        duration: 60, // Default 1 hour
                        classType: "regular",
                      }),
                    );
                  }
                }

                await Promise.all(bookingPromises);

                toast.success(
                  `${bookingPromises.length} classes booked successfully!`,
                  `จอง ${bookingPromises.length} คลาสสำเร็จ!`,
                );
              }

              // Close wizard and navigate to classes tab
              setShowBookingWizard(false);
              handleClose(false);
              onNavigate("classes");
            } catch (error) {
              console.error("Failed to book class:", error);
              toast.error(
                "Failed to book class. Please try again.",
                "การจองคลาสล้มเหลว กรุณาลองอีกครั้ง",
              );
            }
          }}
          onClose={() => setShowBookingWizard(false)}
        />
      )}

      {showClassCountWizard && (
        <ClassCountReportWizard
          key={`class-count-wizard-${language}`}
          userId={user._id}
          userRole={user.role as "teacher" | "moderator"}
          userSchoolId={user.schoolId as Id<"schools"> | undefined}
          onComplete={() => {
            setShowClassCountWizard(false);
            setShowAnalytics(true);
          }}
          onClose={() => setShowClassCountWizard(false)}
        />
      )}

      {showMessageWizard && (
        <MessageWizard
          key={`message-wizard-${language}`}
          userId={user._id}
          userRole={user.role as "teacher" | "moderator"}
          userSchoolId={user.schoolId as Id<"schools"> | undefined}
          onComplete={() => {
            setShowMessageWizard(false);
            handleClose(false);
            onNavigate("calendar"); // Return to dashboard
          }}
          onClose={() => setShowMessageWizard(false)}
        />
      )}

      {showAnalytics && (
        <ClassAnalytics
          key={`analytics-${language}`}
          userId={user._id}
          onClose={() => {
            setShowAnalytics(false);
            handleClose(false);
            onNavigate("calendar"); // Return to dashboard
          }}
        />
      )}

      {showQuickBookWizard && (
        <TeacherQuickBookWizard
          key={`quick-book-wizard-${language}`}
          userId={user._id}
          onComplete={() => {
            setShowQuickBookWizard(false);
            handleClose(false);
            onNavigate("classes"); // Navigate to classes tab
          }}
          onClose={() => setShowQuickBookWizard(false)}
        />
      )}

      {showApprovalWizard && user.schoolId && (
        <ModeratorApprovalWizard
          key={`approval-wizard-${language}`}
          userId={user._id}
          schoolId={user.schoolId as Id<"schools">}
          onComplete={() => {
            setShowApprovalWizard(false);
            handleClose(false);
            onNavigate("classes"); // Navigate to classes tab
          }}
          onClose={() => setShowApprovalWizard(false)}
        />
      )}
    </div>
  );
}
