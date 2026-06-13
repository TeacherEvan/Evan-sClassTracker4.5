'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './query-client';

/**
 * Context for accessing the QueryClient instance
 * This allows components to access the client without prop drilling
 */
const QueryClientContext = createContext<QueryClient | null>(null);

/**
 * Hook to access the QueryClient instance
 * Must be used within a QueryProvider
 */
export function useQueryClientContext(): QueryClient {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error('useQueryClientContext must be used within a QueryProvider');
  }
  return client;
}

/**
 * QueryProvider component that wraps the application with TanStack Query
 * Creates a single QueryClient instance that persists across renders
 * 
 * @param children - Child components to wrap with QueryClientProvider
 */
export function QueryProvider({ children }: Readonly<{ children: ReactNode }>) {
  // Create client once and store in state to avoid recreating on every render
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientContext.Provider value={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </QueryClientContext.Provider>
  );
}