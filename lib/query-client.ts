import { QueryClient } from "@tanstack/react-query";

/**
 * Create a new QueryClient instance with optimized defaults
 *
 * Configuration:
 * - staleTime: 30 seconds - Data is considered fresh for 30s, preventing unnecessary refetches
 * - gcTime: 5 minutes - Unused data is garbage collected after 5 minutes
 * - refetchOnWindowFocus: false - Prevents refetching when window regains focus (better UX)
 * - retry: 1 - Only retry failed queries once
 * - retryDelay: exponential backoff - 1000ms base delay
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000, // 30 seconds
        gcTime: 5 * 60 * 1_000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 1,
      },
    },
  });
}
