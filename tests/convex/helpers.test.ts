import { describe, it, expect } from "vitest";
import schema from "../../convex/schema";

// Type-safe table names from the schema
type SchemaTableNames = keyof typeof schema.tables;

describe("Convex Test Infrastructure", () => {
  it("imports schema successfully", () => {
    expect(schema).toBeDefined();
    expect(schema.tables).toBeDefined();
    expect(Object.keys(schema.tables).length).toBeGreaterThan(10);
  });

  it("has required tables", () => {
    const requiredTables: SchemaTableNames[] = [
      "users",
      "schools",
      "providers",
      "students",
      "classes",
      "locations",
      "notifications",
      "messages",
      "groups",
      "teacherResources",
      "teacherLogs",
      "postClassNotes",
      "appUpdates",
      "userUpdateViews",
      "adminContactRequests",
      "cancellationRequests",
      "teacherClassCountCycles",
      "images",
      "events",
    ];

    for (const table of requiredTables) {
      expect(schema.tables[table]).toBeDefined();
    }
  });

  it("users table has expected fields", () => {
    const usersTable = schema.tables.users;
    expect(usersTable).toBeDefined();
    const requiredFields = [
      "username",
      "passwordHash",
      "role",
      "requirePasswordChange",
      "createdAt",
      "preferredLanguage",
    ];
    for (const field of requiredFields) {
      expect(usersTable.validator.fields).toHaveProperty(field);
    }
  });

  it("providers table supports personal category for private students", () => {
    const providersTable = schema.tables.providers;
    expect(providersTable).toBeDefined();
    expect(providersTable.validator.fields).toHaveProperty("category");
  });

  it("students table has providerId as required", () => {
    const studentsTable = schema.tables.students;
    expect(studentsTable).toBeDefined();
    expect(studentsTable.validator.fields).toHaveProperty("providerId");
  });

  it("classes table supports auto_provider approval source", () => {
    const classesTable = schema.tables.classes;
    expect(classesTable).toBeDefined();
    expect(classesTable.validator.fields).toHaveProperty("approvalSource");
  });

  it("exports schema as default", () => {
    expect(typeof schema).toBe("object");
  });

  it("can import test.setup modules glob", async () => {
    const { modules } = await import("./test.setup");
    expect(modules).toBeDefined();
    expect(typeof modules).toBe("object");
  });
});
