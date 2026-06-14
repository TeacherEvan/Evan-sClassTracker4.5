import { describe, it, expect } from "vitest";
import {
  migrateUsers,
  migrateClasses,
  migrateProviders,
  migrateLocations,
  migrateStudents,
  runAllMigrations,
} from "../../convex/migrateToV2";

describe("Migration Actions", () => {
  it("exports all migration functions", () => {
    expect(migrateUsers).toBeDefined();
    expect(migrateClasses).toBeDefined();
    expect(migrateProviders).toBeDefined();
    expect(migrateLocations).toBeDefined();
    expect(migrateStudents).toBeDefined();
    expect(runAllMigrations).toBeDefined();
  });

  it("exports callable functions", () => {
    // Verify they are internalAction registered functions (callable)
    expect(typeof migrateUsers).toBe("function");
    expect(typeof migrateClasses).toBe("function");
    expect(typeof migrateProviders).toBe("function");
    expect(typeof migrateLocations).toBe("function");
    expect(typeof migrateStudents).toBe("function");
    expect(typeof runAllMigrations).toBe("function");
  });
});
