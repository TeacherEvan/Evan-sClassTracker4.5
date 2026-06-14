"use client";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { createContext, useContext, type ReactNode } from "react";
import { usePollingQuery } from "./use-polling-query";

interface DataContextValue {
  schools: Doc<"schools">[] | undefined;
  isLoading: boolean;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

/**
 * DataProvider - Provides shared static data across the app
 *
 * OPTIMIZATION: Uses polling instead of real-time subscriptions
 * Schools data changes infrequently, so polling every 60 seconds is sufficient
 * This prevents root-level re-renders on every school update
 */
export function DataProvider({ children }: { children: ReactNode }) {
  // Schools: Poll every 60 seconds (static data)
  // BEFORE: useQuery(api.schools.list, {}) - real-time, caused root re-renders
  // AFTER: Poll every 60s - stable, only updates when polling interval hits
  const schools = usePollingQuery(api.schools.list, {}, { interval: 60000 });

  const value: DataContextValue = {
    schools,
    isLoading: schools === undefined,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataContext() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useDataContext must be used within a DataProvider");
  }
  return context;
}
