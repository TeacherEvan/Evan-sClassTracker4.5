"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

// For build time, we need a dummy URL
// At runtime, we'll throw an error if it's not set
const effectiveUrl = convexUrl || "https://dummy.convex.cloud";

const convex = new ConvexReactClient(effectiveUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  // Check at runtime (not build time) if URL is missing
  if (typeof window !== "undefined" && !convexUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Missing NEXT_PUBLIC_CONVEX_URL environment variable. 
              Please set it in your .env.local file or Vercel environment settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
