"use client";

import { Component, ReactNode } from "react";
import { useLanguage } from "@/lib/language-context";

interface Props {
  children: ReactNode;
  componentName?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * LazyErrorBoundary - Error boundary specifically for lazy-loaded components
 * 
 * Provides graceful fallback UI when lazy-loaded chunks fail to load.
 * Common causes:
 * - Network failures during chunk download
 * - Deployment updates while user is active (old chunks deleted)
 * - Browser cache issues
 * 
 * Recovery options:
 * - Reload the page (clears cache and fetches new chunks)
 * - Retry loading the component
 * - Navigate back to safety
 */
export class LazyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("LazyErrorBoundary caught error:", {
      component: this.props.componentName || 'Unknown',
      error,
      errorInfo,
    });

    // Report to error monitoring service if available
    if (typeof window !== 'undefined' && 'reportError' in window && typeof (window as Window & { reportError?: (details: unknown) => void }).reportError === 'function') {
      (window as Window & { reportError: (details: unknown) => void }).reportError({
        type: 'lazy-component-load-failure',
        component: this.props.componentName,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return <LazyErrorFallback 
        error={this.state.error} 
        componentName={this.props.componentName}
        onReset={this.handleReset}
      />;
    }

    return this.props.children;
  }
}

/**
 * LazyErrorFallback - Premium fallback UI for lazy loading failures
 */
function LazyErrorFallback({ 
  error, 
  componentName,
  onReset 
}: { 
  error: Error | null; 
  componentName?: string;
  onReset: () => void;
}) {
  const { t } = useLanguage();

  const isChunkLoadError = error?.message?.includes('Loading chunk') || 
                          error?.message?.includes('Failed to fetch') ||
                          error?.name === 'ChunkLoadError';

  return (
    <div className="flex items-center justify-center h-full min-h-[400px] p-8">
      <div className="max-w-md w-full">
        {/* Error Icon with gradient glow */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl">
              ⚠️
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isChunkLoadError 
              ? t("Unable to Load Component", "ไม่สามารถโหลดส่วนประกอบ")
              : t("Component Error", "ข้อผิดพลาดส่วนประกอบ")
            }
          </h2>

          {componentName && (
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {componentName}
            </p>
          )}

          <p className="text-gray-600 dark:text-gray-400">
            {isChunkLoadError ? (
              <>
                {t(
                  "This usually happens when the app was updated while you were using it. Reloading the page will fix the issue.",
                  "สิ่งนี้มักเกิดขึ้นเมื่อแอปได้รับการอัปเดตในขณะที่คุณกำลังใช้งาน การโหลดหน้าใหม่จะแก้ไขปัญหา"
                )}
              </>
            ) : (
              <>
                {t(
                  "An unexpected error occurred while loading this feature.",
                  "เกิดข้อผิดพลาดที่ไม่คาดคิดขึ้นขณะโหลดฟีเจอร์นี้"
                )}
              </>
            )}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {t("Reload Page", "โหลดหน้าใหม่")}
            </button>
            <button
              onClick={onReset}
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 px-6 rounded-lg font-medium transition-all duration-200"
            >
              {t("Try Again", "ลองอีกครั้ง")}
            </button>
          </div>

          {/* Technical Details (Development Only) */}
          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-6 text-left bg-gray-100 dark:bg-gray-900 rounded-lg">
              <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 p-3 hover:text-gray-800 dark:hover:text-gray-300">
                {t("Technical Details", "รายละเอียดทางเทคนิค")}
              </summary>
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs font-mono text-red-600 dark:text-red-400 mb-2">
                  {error.name}: {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs bg-white dark:bg-gray-950 p-3 rounded overflow-auto max-h-48 text-gray-700 dark:text-gray-300">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * withLazyErrorBoundary - HOC to wrap lazy components with error boundary
 * 
 * Usage:
 * ```tsx
 * const LazyComponent = lazy(() => import('./Component'));
 * const SafeLazyComponent = withLazyErrorBoundary(LazyComponent, 'ComponentName');
 * ```
 */
export function withLazyErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  return function WrappedComponent(props: P) {
    return (
      <LazyErrorBoundary componentName={componentName}>
        <Component {...props} />
      </LazyErrorBoundary>
    );
  };
}
