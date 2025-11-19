# Audit Report: November 2025

## Executive Summary

A critical audit of the codebase was conducted to identify technical debt, security risks, and performance bottlenecks. The backend is largely healthy with good adherence to performance best practices. The primary areas for improvement are frontend performance scaling (specifically in class booking) and database schema hygiene.

## 1. Backend Performance (Convex)

**Status:** ✅ **Healthy**

* **N+1 Query Avoidance:** Core queries (e.g., `listWithDetails` in `convex/classes.ts`, aggregation in `convex/teacherClassCount.ts`) correctly use `Promise.all` and `Set` patterns to batch fetch related records. This prevents the common N+1 performance pitfall.
* **Data Aggregation:** Aggregation logic is performed efficiently on the backend before sending data to the client.

## 2. Security & Rate Limiting

**Status:** ✅ **Secure**

* **Rate Limiting:** Custom `checkRateLimit` utility is correctly applied to sensitive mutations:
  * `api.classes.book`
  * `api.students.create`
* **Access Control:** Role-based access control (RBAC) is enforced via `verifyClassAccess` and explicit role checks in mutations.

## 3. Database Schema

**Status:** ⚠️ **Cleanup Required**

* **Deprecated Fields:** The schema contains fields that appear to be legacy or deprecated:
  * `users` table: `role: "guardian"` (Guardians are now handled via student linking/providers).
  * `classes` table: `isGuardianLinked` (Superseded by `providerId` logic).
* **Action Item:** Schedule a schema migration to remove these fields to prevent confusion and database bloat.

## 4. Frontend Performance

**Status:** ⚠️ **Optimization Needed**

* **Critical Bottleneck in `components/class-booking.tsx`:**
  * **Issue:** The `conflictMap` memoization (lines ~252-260) exhibits **O(N²)** time complexity.
  * **Detail:** It iterates through the `classes` array and, for each item, calls `detectConflicts`, which filters the entire `classes` array again.
  * **Impact:** For a dataset of 2,000 classes, this results in 4,000,000 operations on the main thread. This will cause noticeable UI freezing as the dataset grows.
  * **Recommendation:** Refactor to use a Map/Hash lookup or bucket classes by date to reduce complexity to O(N). Alternatively, move conflict detection to a specialized backend query.

## 5. Code Quality & i18n

**Status:** ✅ **Good**

* **Internationalization:** The `t()` helper is used consistently in the inspected components (`class-booking.tsx`). Hardcoded strings are minimal.
* **Component Structure:** Components like `class-booking.tsx` are large (~3000 lines) and would benefit from further decomposition, though they are functional.

## Recommendations

1. **Refactor `conflictMap`** in `class-booking.tsx` immediately to prevent performance regression as data grows.
2. **Deprecate and remove** unused schema fields.
3. **Continue** using `Promise.all` batching for all new backend queries.
