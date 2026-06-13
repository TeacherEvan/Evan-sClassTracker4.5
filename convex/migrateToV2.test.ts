import { describe, it, expect } from "vitest";

describe("MigrateToV2 Actions", () => {
  it("should export migrateUsers as an internalAction", async () => {
    const mod = await import("./migrateToV2");
    expect(mod).toHaveProperty("migrateUsers");
    expect(mod.migrateUsers).toBeDefined();
    expect(typeof mod.migrateUsers).toBe("function");
  });

  it("should export migrateClasses as an internalAction", async () => {
    const mod = await import("./migrateToV2");
    expect(mod).toHaveProperty("migrateClasses");
    expect(mod.migrateClasses).toBeDefined();
    expect(typeof mod.migrateClasses).toBe("function");
  });

  it("should export migrateProviders as an internalAction", async () => {
    const mod = await import("./migrateToV2");
    expect(mod).toHaveProperty("migrateProviders");
    expect(mod.migrateProviders).toBeDefined();
    expect(typeof mod.migrateProviders).toBe("function");
  });

  it("should export migrateLocations as an internalAction", async () => {
    const mod = await import("./migrateToV2");
    expect(mod).toHaveProperty("migrateLocations");
    expect(mod.migrateLocations).toBeDefined();
    expect(typeof mod.migrateLocations).toBe("function");
  });

  it("should export migrateStudents as an internalAction", async () => {
    const mod = await import("./migrateToV2");
    expect(mod).toHaveProperty("migrateStudents");
    expect(mod.migrateStudents).toBeDefined();
    expect(typeof mod.migrateStudents).toBe("function");
  });

  it("should export runAllMigrations as an internalAction", async () => {
    const mod = await import("./migrateToV2");
    expect(mod).toHaveProperty("runAllMigrations");
    expect(mod.runAllMigrations).toBeDefined();
    expect(typeof mod.runAllMigrations).toBe("function");
  });

  it("should export mutation functions for external use", async () => {
    const mod = await import("./migrateToV2");
    expect(mod.migrateUsersMutation).toBeDefined();
    expect(mod.migrateClassesMutation).toBeDefined();
    expect(mod.migrateProvidersMutation).toBeDefined();
    expect(mod.migrateLocationsMutation).toBeDefined();
    expect(mod.migrateStudentsMutation).toBeDefined();
  });
});