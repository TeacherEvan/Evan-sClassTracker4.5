'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from '@/lib/query-provider';

/**
 * Root providers component that wraps the application with all necessary context providers
 * This separates provider logic from layout for better organization
 * 
 * @param children - Child components to wrap with providers
 */
export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  return <QueryProvider>{children}</QueryProvider>;
}