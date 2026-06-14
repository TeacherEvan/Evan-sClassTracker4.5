// Optimistic Mutation Hook Wrapper
// Provides a convenient wrapper around TanStack Query's useMutation
// with built-in support for optimistic updates

"use client";

import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";

export interface OptimisticMutationOptions<
  TVariables extends Record<string, unknown> = Record<string, unknown>,
  TData = unknown,
  TError = Error,
  TContext = unknown,
> {
  /** The mutation function to execute */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Called before the mutation starts - use for optimistic updates */
  onMutate?: (
    variables: TVariables,
    queryClient: ReturnType<typeof useQueryClient>,
  ) => Promise<TContext | undefined> | TContext | undefined;
  /** Called if the mutation fails - use to rollback optimistic updates */
  onError?: (
    error: TError,
    variables: TVariables,
    context: TContext | undefined,
    queryClient: ReturnType<typeof useQueryClient>,
  ) => void;
  /** Called if the mutation succeeds */
  onSuccess?: (
    data: TData,
    variables: TVariables,
    context: TContext | undefined,
    queryClient: ReturnType<typeof useQueryClient>,
  ) => void;
  /** Called after either success or error */
  onSettled?: (
    data: TData | undefined,
    error: TError | null,
    variables: TVariables,
    context: TContext | undefined,
    queryClient: ReturnType<typeof useQueryClient>,
  ) => void;
}

/**
 * Wrapper around useMutation that provides the queryClient to callbacks
 * for easier optimistic update management
 *
 * @example
 * ```tsx
 * const { mutate } = useOptimisticMutation({
 *   mutationFn: (vars) => api.classes.create(vars),
 *   onMutate: async (vars, queryClient) => {
 *     // Cancel outgoing refetches
 *     await queryClient.cancelQueries({ queryKey: ["classes"] });
 *
 *     // Snapshot previous value
 *     const previous = queryClient.getQueryData(["classes"]);
 *
 *     // Optimistically update
 *     queryClient.setQueryData(["classes"], (old) => [...old, { ...vars, id: "temp" }]);
 *
 *     return { previous };
 *   },
 *   onError: (err, vars, context, queryClient) => {
 *     // Rollback on error
 *     queryClient.setQueryData(["classes"], context.previous);
 *   },
 *   onSettled: (data, error, vars, context, queryClient) => {
 *     // Refetch to sync with server
 *     queryClient.invalidateQueries({ queryKey: ["classes"] });
 *   }
 * });
 * ```
 */
export function useOptimisticMutation<
  TVariables extends Record<string, unknown> = Record<string, unknown>,
  TData = unknown,
  TError = Error,
  TContext = unknown,
>(
  options: OptimisticMutationOptions<TVariables, TData, TError, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    mutationFn: options.mutationFn,
    onMutate: async (variables) => {
      return options.onMutate?.(variables, queryClient);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context, queryClient);
    },
    onSuccess: (data, variables, context) => {
      options.onSuccess?.(data, variables, context, queryClient);
    },
    onSettled: (data, error, variables, context) => {
      options.onSettled?.(data, error, variables, context, queryClient);
    },
  } as UseMutationOptions<TData, TError, TVariables, TContext>);
}

/**
 * Helper for creating optimistic updates to query data
 */
export function createOptimisticUpdater<T extends Record<string, unknown>>(
  queryKey: readonly unknown[],
  newItem: T,
  idField: keyof T = "id" as keyof T,
) {
  return (old: T[] | undefined): T[] => {
    if (!old) return [newItem];
    // Check if item already exists (by id)
    const exists = old.some((item) => item[idField] === newItem[idField]);
    if (exists) {
      return old.map((item) =>
        item[idField] === newItem[idField] ? { ...item, ...newItem } : item,
      );
    }
    return [...old, newItem];
  };
}

/**
 * Helper for removing an item optimistically
 */
export function createOptimisticRemover<T extends Record<string, unknown>>(
  queryKey: readonly unknown[],
  idField: keyof T = "id" as keyof T,
) {
  return (id: T[keyof T]) =>
    (old: T[] | undefined): T[] => {
      if (!old) return [];
      return old.filter((item) => item[idField] !== id);
    };
}

/**
 * Helper for updating an item optimistically
 */
export function createOptimisticUpdaterForId<T extends Record<string, unknown>>(
  queryKey: readonly unknown[],
  id: T[keyof T],
  updates: Partial<T>,
  idField: keyof T = "id" as keyof T,
) {
  return (old: T[] | undefined): T[] => {
    if (!old) return [];
    return old.map((item) =>
      item[idField] === id ? { ...item, ...updates } : item,
    );
  };
}
