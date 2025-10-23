/**
 * Client-side performance tracking utilities
 * Captures device and performance metadata for audit logging
 */

export interface PerformanceMetadata {
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    locale?: string;
    sessionId?: string;
}

/**
 * Generates a unique session ID for tracking user sessions
 * Stored in sessionStorage for duration of browser session
 */
export function getSessionId(): string {
    if (typeof window === "undefined") return "";

    const existingId = sessionStorage.getItem("sessionId");
    if (existingId) return existingId;

    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("sessionId", newId);
    return newId;
}

/**
 * Captures client-side metadata for performance tracking
 * Call this before making mutations that should be tracked
 */
export function capturePerformanceMetadata(): PerformanceMetadata {
    if (typeof window === "undefined") {
        return {}; // Server-side render - no metadata available
    }

    return {
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
        sessionId: getSessionId(),
    };
}

/**
 * Measures execution time of an async operation
 * Usage: const result = await measureExecutionTime(() => myAsyncFunction())
 */
export async function measureExecutionTime<T>(
    operation: () => Promise<T>
): Promise<{ result: T; executionTime: number }> {
    const startTime = performance.now();
    const result = await operation();
    const executionTime = Math.round(performance.now() - startTime);

    return { result, executionTime };
}

/**
 * Creates a performance-tracked wrapper for Convex mutations
 * Automatically captures metadata and execution time
 */
export function withPerformanceTracking<TArgs extends Record<string, unknown>, TResult>(
    mutation: (args: TArgs) => Promise<TResult>
) {
    return async (args: TArgs): Promise<TResult> => {
        const metadata = capturePerformanceMetadata();
        const { result, executionTime } = await measureExecutionTime(() =>
            mutation({ ...args, ...metadata, executionTime: 0 })
        );

        // Log performance to console in development
        if (process.env.NODE_ENV === "development") {
            console.log(`[Performance] Mutation executed in ${executionTime}ms`, {
                args,
                metadata,
            });
        }

        return result;
    };
}
