import type { Doc, Id } from "../_generated/dataModel";
import { MutationCtx } from "../_generated/server";

/**
 * Authorization Helper: Verifies user has permission to access/modify a class
 * - Admins: Can access all schools
 * - Moderators: Can only access classes from their assigned school
 * - Teachers: Can only access their own classes (optional check)
 *
 * @throws Error if unauthorized
 */
export async function verifyClassAccess(
  ctx: MutationCtx,
  userId: Id<"users">,
  classData: Doc<"classes">,
  options: {
    requireModeratorOrAdmin?: boolean;
    allowTeacherOwner?: boolean;
  } = {},
): Promise<void> {
  const user = await ctx.db.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Admin has access to everything
  if (user.role === "admin") {
    return;
  }

  // Moderator can only access their assigned school
  if (user.role === "moderator") {
    if (!user.schoolId || user.schoolId !== classData.schoolId) {
      throw new Error(
        "Unauthorized: Moderators can only manage classes from their assigned school",
      );
    }
    return;
  }

  // Teacher can only access their own classes (if allowed)
  if (user.role === "teacher" && options.allowTeacherOwner) {
    if (classData.teacherId !== userId) {
      throw new Error("Unauthorized: You can only manage your own classes");
    }
    return;
  }

  // Check role requirements if specified (after checking teacher owner exception)
  if (
    options.requireModeratorOrAdmin &&
    !["admin", "moderator"].includes(user.role)
  ) {
    throw new Error(
      "Unauthorized: Only admins and moderators can perform this action",
    );
  }

  // If we get here and teacher isn't allowed, throw error
  if (user.role === "teacher" && !options.allowTeacherOwner) {
    throw new Error("Unauthorized: This action is not available to teachers");
  }
}
