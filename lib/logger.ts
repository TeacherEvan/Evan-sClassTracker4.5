/**
 * Logging Utility
 * Replaces console.* with structured logging
 * Production-safe with environment checks
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  component?: string;
  userId?: string;
  action?: string;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Debug logging (development only)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || "");
    }
  }

  /**
   * Info logging (all environments)
   */
  info(message: string, context?: LogContext) {
    console.info(`[INFO] ${message}`, context || "");
  }

  /**
   * Warning logging (all environments)
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context || "");
  }

  /**
   * Error logging (all environments)
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    console.error(`[ERROR] ${message}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    });

    // In production, could send to error tracking service (Sentry, etc.)
    if (!this.isDevelopment) {
      // TODO: Send to error tracking service
      // sendToErrorTracking({ message, error, context });
    }
  }

  /**
   * Performance logging (development only)
   */
  perf(label: string, startTime: number) {
    if (this.isDevelopment) {
      const duration = performance.now() - startTime;
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Start performance measurement
   */
  startPerf(label: string): () => void {
    const startTime = performance.now();
    return () => this.perf(label, startTime);
  }

  /**
   * Log table (development only)
   */
  table(data: unknown[]) {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Group logs (development only)
   */
  group(label: string) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  /**
   * End log group (development only)
   */
  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }
}

export const logger = new Logger();
