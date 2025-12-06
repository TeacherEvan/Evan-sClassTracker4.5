"use client";

import BottomPanel from "@/components/bottom-panel";
import RightPanel from "@/components/right-panel";
import SidebarNav from "@/components/sidebar-nav";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { lazy, Suspense, useMemo, useState } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

// Lazy-loaded components (same as page.tsx)
const MonthlyCalendar = lazy(() => import("@/components/monthly-calendar").then(m => ({ default: m.MonthlyCalendar })));
const ClassBooking = lazy(() => import("@/components/class-booking").then(m => ({ default: m.ClassBooking })));
const MessagingHub = lazy(() => import("@/components/messaging-hub").then(m => ({ default: m.MessagingHub })));
const NotificationForm = lazy(() => import("@/components/notification-form").then(m => ({ default: m.NotificationForm })));
const NotificationList = lazy(() => import("@/components/notification-list").then(m => ({ default: m.NotificationList })));
const SchoolManagement = lazy(() => import("@/components/school-management").then(m => ({ default: m.SchoolManagement })));
const LocationManagement = lazy(() => import("@/components/location-management").then(m => ({ default: m.LocationManagement })));
const StudentManagement = lazy(() => import("@/components/student-management").then(m => ({ default: m.StudentManagement })));
const ModeratorListView = lazy(() => import("@/components/moderator-list-view").then(m => ({ default: m.ModeratorListView })));
const UserManagement = lazy(() => import("@/components/user-management").then(m => ({ default: m.UserManagement })));
const ModeratorAnalyticsPanel = lazy(() => import("@/components/moderator-analytics-panel").then(m => ({ default: m.ModeratorAnalyticsPanel })));
const TeacherActivityDashboard = lazy(() => import("@/components/teacher-activity-dashboard").then(m => ({ default: m.TeacherActivityDashboard })));
const TeacherHelper = lazy(() => import("@/components/teacher-helper").then(m => ({ default: m.TeacherHelper })));
const TeacherHelperAdmin = lazy(() => import("@/components/teacher-helper-admin").then(m => ({ default: m.TeacherHelperAdmin })));
const DeviceTestingDashboard = lazy(() => import("@/components/device-testing-dashboard"));
const AdminContactRequests = lazy(() => import("@/components/admin-contact-requests").then(m => ({ default: m.AdminContactRequests })));
const AdminNotificationWindows = lazy(() => import("@/components/admin-notification-windows").then(m => ({ default: m.AdminNotificationWindows })));
const AdminAppUpdates = lazy(() => import("@/components/admin-app-updates").then(m => ({ default: m.AdminAppUpdates })));
const AdminDeletedStudentsDashboard = lazy(() => import("@/components/admin-deleted-students-dashboard").then(m => ({ default: m.AdminDeletedStudentsDashboard })));
const AdminAnalyticsDashboard = lazy(() => import("@/components/admin-analytics-dashboard").then(m => ({ default: m.AdminAnalyticsDashboard })));
const EventManagement = lazy(() => import("@/components/event-management").then(m => ({ default: m.EventManagement })));
const SangsomSeedButton = lazy(() => import("@/components/sangsom-seed-button").then(m => ({ default: m.SangsomSeedButton })));
const PrivateClassesSeedButton = lazy(() => import("@/components/private-classes-seed-button").then(m => ({ default: m.PrivateClassesSeedButton })));
const SangsomStudentImportButton = lazy(() => import("@/components/sangsom-student-import-button").then(m => ({ default: m.SangsomStudentImportButton })));
const SangsomMigrationButton = lazy(() => import("@/components/sangsom-migration-button").then(m => ({ default: m.SangsomMigrationButton })));
const SangsomDeleteButton = lazy(() => import("@/components/sangsom-delete-button").then(m => ({ default: m.SangsomDeleteButton })));

// Extended ViewType to include all tabs from page.tsx
export type ViewType =
    | "calendar"
    | "classes"
    | "students"
    | "messages"
    | "events"
    | "schools"
    | "moderators"
    | "locations"
    | "resources"
    | "analytics"
    | "providers"
    | "notifications"
    | "users"
    | "activity"
    | "testing"
    | "contact_requests"
    | "notification_windows"
    | "app_updates"
    | "deleted_students"
    | "data_import";

export type UserRole = "admin" | "moderator" | "teacher";

interface WorkspaceLayoutProps {
    userId: Id<"users">;
    userRole: UserRole;
    userSchoolId?: Id<"schools">;
    children?: React.ReactNode;
}

// Enhanced loading fallback with better UX
const LoadingFallback = () => {
    const { t } = useLanguage();
    return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                {/* Premium animated spinner with gradient glow */}
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
                    <div className="relative animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-clip-border">
                        <div className="absolute inset-1 bg-white dark:bg-gray-900 rounded-full" />
                    </div>
                </div>
                {/* Loading message */}
                <p className="text-base font-medium text-gray-600 dark:text-gray-400 animate-pulse">
                    {t("Loading", "กำลังโหลด")}...
                </p>
                {/* Progress indicator */}
                <div className="w-48 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full animate-[shimmer_2s_ease-in-out_infinite]" 
                         style={{ width: '50%' }} />
                </div>
            </div>
        </div>
    );
};

export default function WorkspaceLayout({ userId, userRole, userSchoolId, children }: WorkspaceLayoutProps) {
    const { t } = useLanguage();
    const [activeView, setActiveView] = useState<ViewType>("calendar");
    const [rightPanelVisible, setRightPanelVisible] = useState(true);
    const [bottomPanelVisible, setBottomPanelVisible] = useState(false);

    // Memoize currentUser object to prevent recreation on every render
    const currentUser: User = useMemo(() => ({
        _id: userId,
        role: userRole,
        schoolId: userSchoolId,
        username: "user", // Placeholder - components load full user if needed
        requirePasswordChange: false,
        createdAt: Date.now()
    }), [userId, userRole, userSchoolId]);

    // Memoize renderContent to prevent recreation on unrelated state changes
    const renderContent = useMemo(() => {
        switch (activeView) {
            case "calendar":
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <MonthlyCalendar currentUser={currentUser} />
                    </Suspense>
                );

            case "classes":
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <ClassBooking userId={userId} userRole={userRole} userSchoolId={userSchoolId} />
                    </Suspense>
                );

            case "events":
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <EventManagement userId={userId} userRole={userRole} schoolId={userSchoolId} />
                    </Suspense>
                );

            case "messages":
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        <MessagingHub currentUser={currentUser} />
                    </Suspense>
                );

            case "analytics":
                // Moderators see their enhanced analytics panel with teacher connections and class flagging
                if (userRole === "moderator" && userSchoolId) {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <ModeratorAnalyticsPanel currentUser={currentUser} />
                        </Suspense>
                    );
                }
                // Admin analytics - show admin-specific analytics dashboard
                if (userRole === "admin") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <AdminAnalyticsDashboard userId={userId} currentUser={currentUser} />
                        </Suspense>
                    );
                }
                return null;

            case "activity":
                if (userRole === "moderator" && userSchoolId) {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <TeacherActivityDashboard schoolId={userSchoolId} moderatorId={userId} />
                        </Suspense>
                    );
                }
                return null;

            case "resources":
                if (userRole === "admin" || userRole === "teacher") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            {userRole === "admin" ? (
                                <TeacherHelperAdmin currentUser={currentUser} />
                            ) : (
                                <TeacherHelper currentUser={currentUser} />
                            )}
                        </Suspense>
                    );
                }
                return null;

            case "notifications":
                return (
                    <Suspense fallback={<LoadingFallback />}>
                        {userRole === "admin" && <NotificationForm />}
                        <NotificationList userId={userId} currentUser={currentUser} />
                    </Suspense>
                );

            case "schools":
                if (userRole === "admin") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <SchoolManagement currentUser={currentUser} />
                        </Suspense>
                    );
                }
                return null;

            case "locations":
                if (userRole === "admin" || userRole === "moderator") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <LocationManagement
                                userId={userId}
                                schoolId={userRole === "moderator" ? userSchoolId : undefined}
                            />
                        </Suspense>
                    );
                }
                return null;

            case "students":
                if (userRole === "admin" || userRole === "moderator") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <StudentManagement currentUser={currentUser} />
                        </Suspense>
                    );
                }
                return null;

            case "moderators":
                if (userRole === "admin") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <ModeratorListView />
                        </Suspense>
                    );
                }
                return null;

            case "users":
                if (userRole === "admin") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <UserManagement currentUserId={userId} />
                        </Suspense>
                    );
                }
                return null;

            case "testing":
                if (userRole === "admin") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <DeviceTestingDashboard />
                        </Suspense>
                    );
                }
                return null;

            case "contact_requests":
                if (userRole === "admin") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <AdminContactRequests currentUserId={userId} />
                        </Suspense>
                    );
                }
                return null;

            case "deleted_students":
                if (userRole === "admin" || userRole === "moderator") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <AdminDeletedStudentsDashboard
                                userId={userId}
                                onClose={() => setActiveView("calendar")}
                            />
                        </Suspense>
                    );
                }
                return null;

            case "notification_windows":
                if (userRole === "admin") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <AdminNotificationWindows currentUserId={userId} />
                        </Suspense>
                    );
                }
                return null;

            case "app_updates":
                if (userRole === "admin") {
                    return (
                        <Suspense fallback={<LoadingFallback />}>
                            <AdminAppUpdates currentUserId={userId} />
                        </Suspense>
                    );
                }
                return null;

            case "data_import":
                if (userRole === "admin") {
                    return (
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
                                        <PrivateClassesSeedButton />
                                        <SangsomStudentImportButton />
                                        <SangsomMigrationButton userId={userId} />
                                        <SangsomDeleteButton userId={userId} />
                                    </div>
                                </div>
                            </div>
                        </Suspense>
                    );
                }
                return null;

            default:
                return children;
        }
    }, [activeView, currentUser, userId, userRole, userSchoolId, t, children]); return (
        <div className="h-screen w-screen overflow-hidden">
            {/* Desktop Layout: Resizable Panels (>1024px) */}
            <div className="hidden lg:block h-full">
                <PanelGroup direction="horizontal" autoSaveId="workspace-layout-desktop">
                    {/* Left Sidebar Panel */}
                    <Panel
                        defaultSize={18}
                        minSize={15}
                        maxSize={30}
                        className="bg-gray-50 dark:bg-gray-900"
                        id="sidebar"
                        order={1}
                    >
                        <SidebarNav
                            activeView={activeView}
                            onViewChange={setActiveView}
                            userRole={userRole}
                        />
                    </Panel>

                    <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors" />

                    {/* Main Content Area with Optional Bottom Panel */}
                    <Panel minSize={30} order={2}>
                        <PanelGroup direction="vertical" autoSaveId="workspace-layout-vertical">
                            {/* Main Content Panel */}
                            <Panel
                                defaultSize={bottomPanelVisible ? 70 : 100}
                                minSize={40}
                                className="glass-panel overflow-y-auto"
                                id="main-content"
                                order={1}
                            >
                                <div className="h-full p-4 md:p-6 animate-pulse-blue">
                                    {renderContent}
                                </div>
                            </Panel>                            {/* Bottom Panel (Collapsible) */}
                            {bottomPanelVisible && (
                                <>
                                    <PanelResizeHandle className="h-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors" />
                                    <Panel
                                        defaultSize={30}
                                        minSize={15}
                                        maxSize={50}
                                        className="border-t border-gray-200 dark:border-gray-700"
                                        id="bottom-panel"
                                        order={2}
                                    >
                                        <BottomPanel
                                            userId={userId}
                                            userRole={userRole}
                                            onClose={() => setBottomPanelVisible(false)}
                                        />
                                    </Panel>
                                </>
                            )}
                        </PanelGroup>
                    </Panel>

                    {/* Right Panel (Collapsible) */}
                    {rightPanelVisible && (
                        <>
                            <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors" />
                            <Panel
                                defaultSize={22}
                                minSize={18}
                                maxSize={35}
                                className="bg-gray-50 dark:bg-gray-900"
                                id="right-panel"
                                order={3}
                            >
                                <RightPanel
                                    userId={userId}
                                    onClose={() => setRightPanelVisible(false)}
                                />
                            </Panel>
                        </>
                    )}
                </PanelGroup>

                {/* Toggle Buttons for Panels */}
                <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
                    {!bottomPanelVisible && (
                        <button
                            onClick={() => setBottomPanelVisible(true)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg shadow-lg transition-colors"
                            title="Show Activity Panel"
                        >
                            ▲ Activity
                        </button>
                    )}
                    {!rightPanelVisible && (
                        <button
                            onClick={() => setRightPanelVisible(true)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg shadow-lg transition-colors"
                            title="Show Right Panel"
                        >
                            ◀ Panel
                        </button>
                    )}
                </div>
            </div>

            {/* Tablet Layout (768px - 1024px) - Static Grid */}
            <div className="hidden md:grid lg:hidden md:grid-cols-[60px_1fr] h-full">
                <aside className="border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    <SidebarNav
                        activeView={activeView}
                        onViewChange={setActiveView}
                        userRole={userRole}
                        compact
                    />
                </aside>

                <main className="overflow-y-auto bg-white dark:bg-gray-800">
                    <div className="p-4 md:p-6">
                        {renderContent}
                    </div>
                </main>
            </div>            {/* Mobile Layout (<768px) - Full Width */}
            <div className="md:hidden h-full overflow-y-auto bg-white dark:bg-gray-800">
                <div className="p-4">
                    {renderContent}
                </div>
            </div>
        </div>
    );
}
