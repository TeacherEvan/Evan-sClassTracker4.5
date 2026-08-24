import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { modules } from "./test.setup";
import { api } from "../../convex/_generated/api";
import {
  createTestUser,
  createTestSchool,
  createTestStudent,
  createTestClass,
} from "./factories";

/**
 * #136 Student Merge/Sync/Soft-delete
 *
 * Functional tests for mergeDuplicateStudents:
 * - redirects ALL student references across every referencing table
 * - soft-deletes non-survivors (isDeleted + mergedIntoId)
 * - writes an auditLogs entry per merge
 * - gates on admin role
 * - forbids self-merge and out-of-set merges (no renaming/forking)
 * - hard deletes (students.remove) are admin-only
 */

type TestId = string;

async function seedMergeScenario(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const now = Date.now();

    const schoolId = await ctx.db.insert(
      "schools",
      createTestSchool() as never,
    );

    const adminId = await ctx.db.insert(
      "users",
      createTestUser({ username: "admin", role: "admin", schoolId }) as never,
    );
    const teacherUserId = await ctx.db.insert(
      "users",
      createTestUser({
        username: "teacher",
        role: "teacher",
        schoolId,
      }) as never,
    );

    const survivorId = await ctx.db.insert(
      "students",
      createTestStudent({
        firstName: "Somchai",
        lastName: "Jaidee",
        studentId: "STU-SURVIVOR",
        schoolId,
        grade: "K1",
        createdBy: teacherUserId,
      }) as never,
    );
    const dupeId = await ctx.db.insert(
      "students",
      createTestStudent({
        firstName: "somchai",
        lastName: "Jaidee",
        studentId: "STU-DUPE",
        schoolId,
        grade: "K1",
        dateOfBirth: new Date("2015-01-01").getTime(),
        guardianPhone: "080-000-0000",
        createdBy: teacherUserId,
      }) as never,
    );
    const unrelatedStudentId = await ctx.db.insert(
      "students",
      createTestStudent({
        firstName: "Unrelated",
        lastName: "Kid",
        studentId: "STU-OTHER",
        schoolId,
      }) as never,
    );

    // 1. class owned by the duplicate
    const ownedClassId = await ctx.db.insert(
      "classes",
      createTestClass({
        teacherId: teacherUserId,
        studentId: dupeId,
        schoolId,
      }) as never,
    );

    // 2. class rostered with the duplicate as additional student
    const rosterClassId = await ctx.db.insert("classes", {
      ...createTestClass({
        teacherId: teacherUserId,
        studentId: unrelatedStudentId,
        schoolId,
      }),
      additionalStudentIds: [dupeId],
    } as never);

    // 3. post-class note for the duplicate
    const noteId = await ctx.db.insert("postClassNotes", {
      classId: ownedClassId,
      teacherId: teacherUserId,
      studentId: dupeId,
      schoolId,
      attendance: "present",
      notes: "did great",
      createdAt: now,
      skipped: false,
    });

    // 4. teacher log related to the duplicate
    const logId = await ctx.db.insert("teacherLogs", {
      teacherId: teacherUserId,
      schoolId,
      action: "class_requested",
      actionTh: "ขอเรียน",
      details: "requested",
      detailsTh: "ขอเรียน",
      relatedStudentId: dupeId,
      createdAt: now,
    });

    // 5. user shortcut pointing at the duplicate
    const shortcutUserId = await ctx.db.insert("users", {
      ...(createTestUser({
        username: "shortcut",
        role: "moderator",
        schoolId,
      }) as Record<string, unknown>),
      wizardPreferences: { recentStudentIds: [dupeId] },
    } as never);

    // 6. a second watchlist entry also referencing the duplicate
    const otherEntryId = await ctx.db.insert("duplicateWatchlist", {
      studentId: unrelatedStudentId,
      possibleDuplicateIds: [dupeId],
      matchedFields: 4,
      matchDetails: {
        firstName: false,
        lastName: false,
        grade: true,
        dateOfBirth: false,
        guardianPhone: false,
        area: false,
        schoolId: true,
      },
      status: "pending",
      createdAt: now,
      userDecision: "create_new",
      userDecisionBy: adminId,
    });

    // the entry driving this merge
    const entryId = await ctx.db.insert("duplicateWatchlist", {
      studentId: dupeId,
      possibleDuplicateIds: [survivorId],
      matchedFields: 5,
      matchDetails: {
        firstName: true,
        lastName: true,
        grade: true,
        dateOfBirth: true,
        guardianPhone: true,
        area: false,
        schoolId: true,
      },
      status: "pending",
      createdAt: now,
      userDecision: "create_new",
      userDecisionBy: adminId,
    });

    return {
      schoolId,
      adminId,
      teacherUserId,
      survivorId,
      dupeId,
      unrelatedStudentId,
      ownedClassId,
      rosterClassId,
      noteId,
      logId,
      shortcutUserId,
      otherEntryId,
      entryId,
    };
  });
}

describe("#136 mergeDuplicateStudents", () => {
  it("redirects all references, soft-deletes non-survivors, writes audit log", async () => {
    const t = convexTest(schema, modules);
    const s = await seedMergeScenario(t);

    const result = (await t.mutation(
      api.duplicateDetection.mergeDuplicateStudents,
      {
        entryId: s.entryId as never,
        keepStudentId: s.survivorId as never,
        deleteStudentIds: [s.dupeId as never],
        userId: s.adminId as never,
        notes: "test merge",
      },
    )) as { success: boolean };

    expect(result.success).toBe(true);

    await t.run(async (ctx) => {
      // classes.studentId redirected
      const ownedClass = await ctx.db.get(s.ownedClassId as never);
      expect((ownedClass as { studentId: TestId }).studentId).toBe(
        s.survivorId,
      );

      // classes.additionalStudentIds redirected to survivor
      const rosterClass = await ctx.db.get(s.rosterClassId as never);
      expect(
        (rosterClass as { additionalStudentIds?: TestId[] })
          .additionalStudentIds,
      ).toContain(s.survivorId);
      expect(
        (rosterClass as { additionalStudentIds?: TestId[] })
          .additionalStudentIds,
      ).not.toContain(s.dupeId);

      // postClassNotes.studentId redirected
      const note = await ctx.db.get(s.noteId as never);
      expect((note as { studentId: TestId }).studentId).toBe(s.survivorId);

      // teacherLogs.relatedStudentId redirected
      const log = await ctx.db.get(s.logId as never);
      expect((log as { relatedStudentId?: TestId }).relatedStudentId).toBe(
        s.survivorId,
      );

      // users.wizardPreferences.recentStudentIds redirected
      const shortcutUser = await ctx.db.get(s.shortcutUserId as never);
      expect(
        (
          shortcutUser as {
            wizardPreferences?: { recentStudentIds?: TestId[] };
          }
        ).wizardPreferences?.recentStudentIds,
      ).toContain(s.survivorId);

      // second watchlist entry redirected to survivor
      const otherEntry = await ctx.db.get(s.otherEntryId as never);
      expect(
        (otherEntry as { possibleDuplicateIds: TestId[] }).possibleDuplicateIds,
      ).toContain(s.survivorId);
      expect(
        (otherEntry as { possibleDuplicateIds: TestId[] }).possibleDuplicateIds,
      ).not.toContain(s.dupeId);

      // non-survivor soft-deleted with mergedIntoId (never hard-deleted)
      const merged = await ctx.db.get(s.dupeId as never);
      expect(merged).not.toBeNull();
      expect((merged as { isDeleted?: boolean }).isDeleted).toBe(true);
      expect((merged as { mergedIntoId?: TestId }).mergedIntoId).toBe(
        s.survivorId,
      );
      expect((merged as { deletionReason?: string }).deletionReason).toContain(
        "Merged",
      );

      // driving entry finalized
      const entry = await ctx.db.get(s.entryId as never);
      expect((entry as { status: string }).status).toBe("merged");
      expect((entry as { mergedIntoId?: TestId }).mergedIntoId).toBe(
        s.survivorId,
      );

      // survivor untouched (survivor-wins, no rename)
      const survivor = await ctx.db.get(s.survivorId as never);
      expect((survivor as { studentId: string }).studentId).toBe(
        "STU-SURVIVOR",
      );
      expect((survivor as { isDeleted?: boolean }).isDeleted).toBeFalsy();

      // audit trail written
      const audits = await ctx.db.query("auditLogs").collect();
      const mergeAudit = audits.find(
        (a) => (a as { action: string }).action === "merge_students",
      ) as
        | {
            userId: TestId;
            targetId?: string;
            affectedCount?: number;
            details?: string;
          }
        | undefined;
      expect(mergeAudit).toBeDefined();
      expect(mergeAudit!.userId).toBe(s.adminId);
      expect(mergeAudit!.targetId).toBe(s.survivorId);
      expect(mergeAudit!.affectedCount).toBe(1);
      const details = JSON.parse(mergeAudit!.details ?? "{}");
      expect(details.conflictPolicy).toBe("survivor_wins_with_audit");
      expect(details.redirects.classes).toBe(1);
      expect(details.redirects.classRosters).toBe(1);
      expect(details.redirects.postClassNotes).toBe(1);
      expect(details.redirects.teacherLogs).toBe(1);
      expect(details.redirects.userRecentStudents).toBe(1);
      expect(details.redirects.watchlistEntries).toBe(1);
    });
  });

  it("rejects non-admin users", async () => {
    const t = convexTest(schema, modules);
    const s = await seedMergeScenario(t);

    await expect(
      t.mutation(api.duplicateDetection.mergeDuplicateStudents, {
        entryId: s.entryId as never,
        keepStudentId: s.survivorId as never,
        deleteStudentIds: [s.dupeId as never],
        userId: s.teacherUserId as never,
      }),
    ).rejects.toThrow("Unauthorized: Admin access required");
  });

  it("rejects merging a student into itself", async () => {
    const t = convexTest(schema, modules);
    const s = await seedMergeScenario(t);

    await expect(
      t.mutation(api.duplicateDetection.mergeDuplicateStudents, {
        entryId: s.entryId as never,
        keepStudentId: s.survivorId as never,
        deleteStudentIds: [s.survivorId as never],
        userId: s.adminId as never,
      }),
    ).rejects.toThrow("Cannot merge a student into itself");
  });

  it("rejects merging students outside the watchlist duplicate set (no forking)", async () => {
    const t = convexTest(schema, modules);
    const s = await seedMergeScenario(t);

    await expect(
      t.mutation(api.duplicateDetection.mergeDuplicateStudents, {
        entryId: s.entryId as never,
        keepStudentId: s.survivorId as never,
        deleteStudentIds: [s.unrelatedStudentId as never],
        userId: s.adminId as never,
      }),
    ).rejects.toThrow(/not part of this duplicate set/);
  });
});

describe("#136 students.remove hard-delete gate", () => {
  it("allows admins to hard-delete", async () => {
    const t = convexTest(schema, modules);
    const s = await seedMergeScenario(t);

    // Clear the blocking active-class fixture (pre-existing students.remove
    // guard refuses deletion while active/pending classes reference the student)
    await t.run(async (ctx) => {
      await ctx.db.delete(s.rosterClassId as never);
    });

    const result = (await t.mutation(api.students.remove, {
      id: s.unrelatedStudentId as never,
      deletedBy: s.adminId as never,
      reason: "hard delete by admin",
    })) as { success: boolean };
    expect(result.success).toBe(true);

    await t.run(async (ctx) => {
      const gone = await ctx.db.get(s.unrelatedStudentId as never);
      expect(gone).toBeNull();
    });
  });

  it("rejects teachers from hard-deleting", async () => {
    const t = convexTest(schema, modules);
    const s = await seedMergeScenario(t);

    await expect(
      t.mutation(api.students.remove, {
        id: s.unrelatedStudentId as never,
        deletedBy: s.teacherUserId as never,
        reason: "should be blocked",
      }),
    ).rejects.toThrow(/Only admins can hard-delete/);
  });
});
