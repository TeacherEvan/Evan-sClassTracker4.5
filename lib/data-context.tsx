"use client";

import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { createContext, useContext, type ReactNode } from "react";

interface DataContextValue {
    schools: Doc<"schools">[] | undefined;
    isLoading: boolean;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
    // Load commonly used data once at the top level
    const schools = useQuery(api.schools.list, {});

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
