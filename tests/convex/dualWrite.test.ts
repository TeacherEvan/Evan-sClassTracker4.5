import { describe, it, expect } from "vitest";
import { dualWriteStudent, dualWriteClass, dualWriteProvider } from "../../convex/dualWrite";

describe("Dual-Write Mutations", () => {
  it("exports dualWrite functions", () => {
    expect(dualWriteStudent).toBeDefined();
    expect(dualWriteClass).toBeDefined();
    expect(dualWriteProvider).toBeDefined();
  });

  it("exports callable functions", () => {
    expect(typeof dualWriteStudent).toBe("function");
    expect(typeof dualWriteClass).toBe("function");
    expect(typeof dualWriteProvider).toBe("function");
  });
});