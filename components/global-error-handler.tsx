"use client";

import { useEffect } from "react";

/**
 * Global error handler that catches unhandled errors and promise rejections
 * This provides a safety net for errors that escape React's error boundary
 */
export function GlobalErrorHandler() {
    useEffect(() => {
        // Handler for unhandled errors
        const handleError = (event: ErrorEvent) => {
            event.preventDefault(); // Prevent default browser error handling

            console.error("🚨 Unhandled error caught:", {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
            });

            // Check if it's a date error
            if (event.message.includes("Invalid Date") || event.message.includes("invalid date")) {
                // Show user-friendly toast notification instead of crashing
                if (typeof window !== "undefined") {
                    // Dynamically import toast to avoid circular dependencies
                    import("@/lib/toast").then(({ toast }) => {
                        toast.error(
                            "Date Error - Please refresh the page",
                            "ข้อผิดพลาดเกี่ยวกับวันที่ - กรุณารีเฟรชหน้านี้",
                            "Date Error",
                            "ข้อผิดพลาดวันที่",
                            {
                                errorOrigin: event.filename || "Unknown file",
                                errorFunction: "Global error handler",
                                userAction: "System encountered invalid date",
                                stackTrace: event.error?.stack,
                            }
                        );
                    });
                }
            }
        };

        // Handler for unhandled promise rejections
        const handleRejection = (event: PromiseRejectionEvent) => {
            event.preventDefault(); // Prevent default browser rejection handling

            console.error("🚨 Unhandled promise rejection:", {
                reason: event.reason,
                promise: event.promise,
            });

            // Check if it's a date error
            const reasonStr = String(event.reason?.message || event.reason || "");
            if (reasonStr.includes("Invalid Date") || reasonStr.includes("invalid date")) {
                if (typeof window !== "undefined") {
                    import("@/lib/toast").then(({ toast }) => {
                        toast.error(
                            "Date Error - Please refresh the page",
                            "ข้อผิดพลาดเกี่ยวกับวันที่ - กรุณารีเฟรชหน้านี้",
                            "Date Error",
                            "ข้อผิดพลาดวันที่",
                            {
                                errorOrigin: "Promise rejection",
                                errorFunction: "Global rejection handler",
                                userAction: "Async operation failed with date error",
                                stackTrace: event.reason?.stack,
                            }
                        );
                    });
                }
            }
        };

        // Attach listeners
        window.addEventListener("error", handleError);
        window.addEventListener("unhandledrejection", handleRejection);

        // Cleanup
        return () => {
            window.removeEventListener("error", handleError);
            window.removeEventListener("unhandledrejection", handleRejection);
        };
    }, []);

    return null; // This component doesn't render anything
}
