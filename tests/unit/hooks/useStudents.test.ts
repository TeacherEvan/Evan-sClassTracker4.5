import { describe, it, expect } from "vitest";
import { useStudents, useCreateStudent, useClass, useCreateClass } from "../../../lib/convex/hooks";

describe("Generated Convex Hooks", () => {
  it("exports useStudents hook", () => {
    expect(useStudents).toBeDefined();
    expect(typeof useStudents).toBe("function");
  });

  it("exports useCreateStudent hook", () => {
    expect(useCreateStudent).toBeDefined();
    expect(typeof useCreateStudent).toBe("function");
  });

  it("exports useClass hook", () => {
    expect(useClass).toBeDefined();
    expect(typeof useClass).toBe("function");
  });

  it("exports useCreateClass hook", () => {
    expect(useCreateClass).toBeDefined();
    expect(typeof useCreateClass).toBe("function");
  });
});