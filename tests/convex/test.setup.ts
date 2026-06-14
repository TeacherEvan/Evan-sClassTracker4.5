/// <reference types="vite/client" />

/**
 * Convex modules for testing
 * This glob pattern includes all TypeScript files in the convex directory
 * Used by convex-test to load queries, mutations, and actions
 * Includes _generated directory which is required by convex-test
 */
export const modules = import.meta.glob("../../convex/**/*.ts");
