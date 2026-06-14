/**
 * usePollingQuery - Poll-based data fetching for static/rarely-changing data
 *
 * Use this instead of useQuery for data that:
 * - Changes infrequently (schools, locations, user lists)
 * - Doesn't need instant updates
 * - Would cause unnecessary re-renders with real-time subscriptions
 *
 * Benefits:
 * - Reduces WebSocket traffic
 * - Prevents unnecessary component re-renders
 * - Improves battery life on mobile devices
 *
 * @example
 * // Instead of real-time subscription:
 * // const schools = useQuery(api.schools.list, {});
 *
 * // Use polling (updates every 60 seconds):
 * const schools = usePollingQuery(api.schools.list, {}, 60000);
 */

import { useConvex } from "convex/react";
import { FunctionReference } from "convex/server";
import { useCallback, useEffect, useState, useRef } from "react";

interface PollingOptions {
  /** Polling interval in milliseconds (default: 10000 = 10 seconds) */
  interval?: number;
  /** Enable/disable polling (default: true) */
  enabled?: boolean;
  /** Fetch immediately on mount (default: true) */
  fetchOnMount?: boolean;
}

export function usePollingQuery<T>(
  query: FunctionReference<"query", "public", Record<string, unknown>, T>,
  args: Record<string, unknown>,
  options: PollingOptions = {},
): T | undefined {
  const { interval = 10000, enabled = true, fetchOnMount = true } = options;

  const convex = useConvex();
  const [data, setData] = useState<T | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const argsRef = useRef(args);

  // Update args ref when they change
  useEffect(() => {
    argsRef.current = args;
  }, [args]);

  // Fetch function
  const fetchData = useCallback(async () => {
    try {
      const result = await convex.query(query, argsRef.current);
      setData(result);
    } catch (error) {
      console.error("usePollingQuery error:", error);
    }
  }, [convex, query]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Fetch on mount if enabled
    if (fetchOnMount) {
      fetchData();
    }

    // Set up polling interval
    timerRef.current = setInterval(fetchData, interval);

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, interval, fetchOnMount]);

  return data;
}

/**
 * useManualRefreshQuery - Manual refresh with optional auto-refresh
 *
 * Use for analytics, dashboards, or reports that don't need constant updates
 *
 * @example
 * const { data, refresh, isLoading } = useManualRefreshQuery(api.analytics.getStats, {});
 *
 * <button onClick={refresh}>Refresh</button>
 */
export function useManualRefreshQuery<T>(
  query: FunctionReference<"query", "public", Record<string, unknown>, T>,
  args: Record<string, unknown>,
  autoRefreshInterval?: number,
): {
  data: T | undefined;
  refresh: () => Promise<void>;
  isLoading: boolean;
} {
  const convex = useConvex();
  const [data, setData] = useState<T | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const argsRef = useRef(args);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    argsRef.current = args;
  }, [args]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await convex.query(query, argsRef.current);
      setData(result);
    } catch (error) {
      console.error("useManualRefreshQuery error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [convex, query]);

  // Initial fetch
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh if interval specified
  useEffect(() => {
    if (autoRefreshInterval && autoRefreshInterval > 0) {
      timerRef.current = setInterval(() => {
        // Only refresh if page is visible
        if (document.visibilityState === "visible") {
          refresh();
        }
      }, autoRefreshInterval);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshInterval]);

  return { data, refresh, isLoading };
}
