import { describe, it, expect } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { modules } from "./test.setup";
import { api } from "../../convex/_generated/api";
import {
  createTestUser,
  createTestSchool,
  createTestClass,
  createTestStudent,
} from "./factories";

/**
 * #141 Moderator Ghost Role & Analytics — school scoping regression tests
 *
 * Security contract under test:
 * - Moderators can ONLY connect/disconnect teachers to THEIR school
 *   (teacherSchools.connect / disconnect)
 * - Moderators can ONLY flag classes for review within THEIR school
 *   (classReview.flagForReview)
 */

async function seedTwoSchoolScenario(t: ReturnType<typeof convexTest>) {
  return t.run(async (ctx) => {
    const now = Date.now();

    const schoolAId = await ctx.db.insert(
      "schools",
      createTestSchool({ name: "School A", district: "District A" }) as never,
    );
    const schoolBId = await ctx.db.insert(
      "schools",
      createTestSchool({ name: "School B", district: "District B" }) as never,
    );

    const moderatorAId = await ctx.db.insert(
      "users",
      createTestUser({
        username: "mod_a",
        role: "moderator",
        schoolId: schoolAId,
      }) as never,
    );

    const teacherBId = await ctx.db.insert(
      "users",
      createTestUser({
        username: "teacher_b",
        role: "teacher",
        schoolId: schoolBId,
      }) as never,
    );

    const teacherAId = await ctx.db.insert(
      "users",
      createTestUser({
        username: "teacher_a",
        role: "teacher",
        schoolId: schoolAId,
      }) as never,
    );

    // A class in School B, owned by teacher B
    const classBId = await ctx.db.insert(
      "classes",
      createTestClass({
        schoolId: schoolBId,
        teacherId: teacherBId,
        studentId: (await ctx.db.insert(
          "students",
          createTestStudent({
            firstName: "B",
            lastName: "Student",
            studentId: "STU-B",
            schoolId: schoolBId,
            grade: "K1",
            createdBy: teacherBId,
          }) as never,
        )) as never,
      }) as never,
    );

    void now;
    return {
      schoolAId,
      schoolBId,
      moderatorAId,
      teacherAId,
      teacherBId,
      classBId,
    };
  });
}

describe("#141 moderator school scoping — teacher connections", () => {
  it("allows a moderator to connect a teacher to their OWN school", async () => {
    const t = convexTest(schema, modules);
    const s = await seedTwoSchoolScenario(t);

    const result = (await t.mutation(api.teacherSchools.connect, {
      teacherId: s.teacherAId as never,
      schoolId: s.schoolAId as never,
      userId: s.moderatorAId as never,
    })) as { success: boolean };

    expect(result.success).toBe(true);
  });

  it("REJECTS a moderator connecting a teacher to another school", async () => {
    const t = convexTest(schema, modules);
    const s = await seedTwoSchoolScenario(t);

    await expect(
      t.mutation(api.teacherSchools.connect, {
        teacherId: s.teacherAId as never,
        schoolId: s.schoolBId as never,
        userId: s.moderatorAId as never,
      }),
    ).rejects.toThrow(/assigned school/i);
  });

  it("REJECTS a moderator disconnecting a teacher from another school", async () => {
    const t = convexTest(schema, modules);
    const s = await seedTwoSchoolScenario(t);

    await expect(
      t.mutation(api.teacherSchools.disconnect, {
        teacherId: s.teacherBId as never,
        schoolId: s.schoolBId as never,
        userId: s.moderatorAId as never,
      }),
    ).rejects.toThrow(/assigned school/i);
  });

  it("REJECTS a moderator with no assigned school entirely", async () => {
    const t = convexTest(schema, modules);
    const s = await seedTwoSchoolScenario(t);

    const orphanModId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        createTestUser({
          username: "mod_orphan",
          role: "moderator",
          schoolId: undefined,
        }) as never,
      ),
    );

    await expect(
      t.mutation(api.teacherSchools.connect, {
        teacherId: s.teacherAId as never,
        schoolId: s.schoolAId as never,
        userId: orphanModId as never,
      }),
    ).rejects.toThrow(/assigned to a school/i);
  });
});

describe("#141 moderator school scoping — class review flagging", () => {
  it("REJECTS a moderator flagging a class in ANOTHER school", async () => {
    const t = convexTest(schema, modules);
    const s = await seedTwoSchoolScenario(t);

    await expect(
      t.mutation(api.classReview.flagForReview, {
        classId: s.classBId as never,
        userId: s.moderatorAId as never,
        reviewNotes: "Cross-school flag attempt",
      }),
    ).rejects.toThrow(/assigned school/i);
  });

  it("ALLOWS an admin to flag a class in any school", async () => {
    const t = convexTest(schema, modules);
    const s = await seedTwoSchoolScenario(t);

    const adminId = await t.run(async (ctx) =>
      ctx.db.insert(
        "users",
        createTestUser({
          username: "admin_root",
          role: "admin",
        }) as never,
      ),
    );

    const result = (await t.mutation(api.classReview.flagForReview, {
      classId: s.classBId as never,
      userId: adminId as never,
      reviewNotes: "Admin cross-school review",
    })) as { success: boolean };

    expect(result.success).toBe(true);
  });
});
