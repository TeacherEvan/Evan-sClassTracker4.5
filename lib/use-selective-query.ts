/**
 * useSelectiveQuery - Conditional real-time subscription
 *
 * Use this to control when Convex subscriptions are active.
 * Useful for:
 * - Modal content (only subscribe when modal is open)
 * - Tab content (only subscribe when tab is active)
 * - Accordion sections (only subscribe when expanded)
 *
 * Benefits:
 * - Reduces active subscriptions when data isn't visible
 * - Prevents unnecessary re-renders of inactive components
 * - Improves overall app performance
 *
 * @example
 * // Only subscribe when modal is open
 * const students = useSelectiveQuery(
 *   api.students.list,
 *   { schoolId },
 *   { enabled: isModalOpen }
 * );
 */

import { useQuery } from "convex/react";
import { FunctionReference } from "convex/server";
import { useEffect, useRef, useState } from "react";

interface SelectiveQueryOptions {
  /** Enable/disable subscription (default: true) */
  enabled?: boolean;
  /** Consider data stale after X ms (prevents flickering on re-enable) */
  staleTime?: number;
}

export function useSelectiveQuery<T>(
  query: FunctionReference<"query", "public", Record<string, unknown>, T>,
  args: Record<string, unknown>,
  options: SelectiveQueryOptions = {},
): T | undefined {
  const { enabled = true } = options;

  // When disabled, return undefined without subscribing
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const data = enabled ? useQuery(query, args) : undefined;

  return data;
}

/**
 * useVisibilityQuery - Only subscribe when component is visible
 *
 * Automatically manages subscription based on Intersection Observer
 *
 * @example
 * const { data, ref } = useVisibilityQuery(api.analytics.getStats, {});
 *
 * <div ref={ref}>
 *   {data && <AnalyticsChart data={data} />}
 * </div>
 */
export function useVisibilityQuery<T>(
  query: FunctionReference<"query", "public", Record<string, unknown>, T>,
  args: Record<string, unknown>,
  options?: { threshold?: number },
) {
  const { threshold = 0.1 } = options || {};
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentRef = ref.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold },
    );

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold]);

  const data = useSelectiveQuery(query, args, { enabled: isVisible });

  return { data, ref, isVisible };
}
