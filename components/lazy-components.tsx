"use client";

import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

// Lazy load admin-only components
export const LazyAdminAnalyticsDashboard = lazy(() =>
  import("./admin-analytics-dashboard").then(mod => ({ default: mod.AdminAnalyticsDashboard }))
);

export const LazyAdminAppUpdates = lazy(() =>
  import("./admin-app-updates").then(mod => ({ default: mod.AdminAppUpdates }))
);

export const LazyAdminContactButton = lazy(() =>
  import("./admin-contact-button").then(mod => ({ default: mod.AdminContactButton }))
);

export const LazyAdminContactRequests = lazy(() =>
  import("./admin-contact-requests").then(mod => ({ default: mod.AdminContactRequests }))
);

export const LazyAdminDeletedStudentsDashboard = lazy(() =>
  import("./admin-deleted-students-dashboard").then(mod => ({ default: mod.AdminDeletedStudentsDashboard }))
);

export const LazyAdminErrorReports = lazy(() =>
  import("./admin-error-reports").then(mod => ({ default: mod.AdminErrorReports }))
);

export const LazyAdminNotificationWindows = lazy(() =>
  import("./admin-notification-windows").then(mod => ({ default: mod.AdminNotificationWindows }))
);

export const LazyAuditLogs = lazy(() =>
  import("./audit-logs").then(mod => ({ default: mod.AuditLogs }))
);

// Note: DeviceTestingDashboard uses 'export default' so no transformation needed
export const LazyDeviceTestingDashboard = lazy(() =>
  import("./device-testing-dashboard")
);

export const LazyBulkEditStudentsModal = lazy(() =>
  import("./bulk-edit-students-modal").then(mod => ({ default: mod.BulkEditStudentsModal }))
);

export const LazyClassPaymentCalculator = lazy(() =>
  import("./class-payment-calculator").then(mod => ({ default: mod.ClassPaymentCalculator }))
);

export const LazyTeacherClassCountModal = lazy(() =>
  import("./teacher-class-count-modal").then(mod => ({ default: mod.TeacherClassCountModal }))
);

export const LazyClassAnalytics = lazy(() =>
  import("./class-analytics").then(mod => ({ default: mod.ClassAnalytics }))
);

// Fallback loading components
interface SuspenseWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminComponentWrapper({ children, fallback }: SuspenseWrapperProps) {
  return (
    <Suspense fallback={fallback || <AdminLoadingFallback />}>
      {children}
    </Suspense>
  );
}

export function AdminLoadingFallback() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
        <DashboardCardSkeleton />
      </div>
      <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
    </div>
  );
}

export function ModalLoadingFallback() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    </div>
  );
}

export function TableLoadingFallback() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Simple dashboard card skeleton for loading state
function DashboardCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  );
}

// Helper HOC for wrapping lazy components with Suspense
export function withSuspense<P extends object>(
  LazyComponent: ComponentType<P>,
  FallbackComponent: ComponentType = AdminLoadingFallback
) {
  return function WrappedComponent(props: P) {
    return (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}
