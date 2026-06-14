import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../users";

describe("PBKDF2 Password Hashing", () => {
  it("should hash passwords securely with PBKDF2 format", async () => {
    const password = "TeacherAdmin";
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^pbkdf2\$/); // Correct format
    expect(hash.split("$").length).toBe(3); // pbkdf2$salt$hash
    expect(hash).not.toContain(password); // No plaintext
  });

  it("should verify correct passwords", async () => {
    const password = "TeacherAdmin";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("should reject incorrect passwords", async () => {
    const hash = await hashPassword("TeacherAdmin");

    const isValid = await verifyPassword("WrongPassword", hash);
    expect(isValid).toBe(false);
  });

  it("should not create identical hashes for same password (different salts)", async () => {
    const hash1 = await hashPassword("TeacherAdmin");
    const hash2 = await hashPassword("TeacherAdmin");

    expect(hash1).not.toEqual(hash2); // Different salts = different hashes
  });

  it("should verify legacy btoa() passwords (backward compatibility)", async () => {
    const password = "TeacherAdmin";
    const legacyHash = btoa(password); // VGVhY2hlckFkbWlu

    const isValid = await verifyPassword(password, legacyHash);
    expect(isValid).toBe(true);
  });

  it("should reject bcrypt hashes with helpful error message", async () => {
    const bcryptHash = "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890";

    await expect(verifyPassword("password", bcryptHash)).rejects.toThrow(
      "Your password format is outdated. Please contact an admin to reset your password.",
    );
  });
});
