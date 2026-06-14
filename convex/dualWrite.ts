// Dual-Write Mutations for Schema v2 Migration
// Note: This project uses in-place schema migration (schema.ts -> schemaV2.ts)
// rather than dual-write to parallel tables. The migration actions in
// migrateToV2.ts transform existing data directly. This file provides
// placeholder exports for API compatibility during transition.

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Placeholder dual-write for students - transforms data in-place via migration
 * instead of writing to parallel tables.
 */
export const dualWriteStudent = internalMutation({
  args: {
    // During transition, student mutations already write to the schema
    // that will become schemaV2. No dual-write needed.
    studentId: v.string(),
  },
  handler: async (_ctx, _args) => {
    // Migration handled by migrateToV2.migrateStudents
    return { migrated: true };
  },
});

/**
 * Placeholder dual-write for classes
 */
export const dualWriteClass = internalMutation({
  args: { classId: v.string() },
  handler: async (_ctx, _args) => {
    return { migrated: true };
  },
});

/**
 * Placeholder dual-write for providers
 */
export const dualWriteProvider = internalMutation({
  args: { providerId: v.string() },
  handler: async (_ctx, _args) => {
    return { migrated: true };
  },
});
