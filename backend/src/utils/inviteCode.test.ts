import { describe, expect, it } from "vitest";
import { generateInviteCode, normalizeInviteCode } from "./inviteCode.js";

describe("inviteCode", () => {
  it("generates an 8-character code from the safe alphabet", () => {
    const code = generateInviteCode();
    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z2-9]+$/);
  });

  it("normalizes messy invite input", () => {
    expect(normalizeInviteCode(" ab-cd12 ")).toBe("ABCD12");
  });
});
