import { describe, expect, it } from "vitest";
import { TORI_CHAT_LIMITS, validateToriChatBody } from "./validation.js";

const HOUSEHOLD_ID = "11111111-1111-4111-8111-111111111111";

describe("validateToriChatBody", () => {
  function errorOf(body: Record<string, unknown>) {
    const result = validateToriChatBody(body);
    return "error" in result ? result.error : undefined;
  }

  it("accepts a single user message", () => {
    expect(
      validateToriChatBody({
        householdId: HOUSEHOLD_ID,
        messages: [{ role: "user", content: "  How should I store rice?  " }],
      })
    ).toEqual({
      householdId: HOUSEHOLD_ID,
      messages: [{ role: "user", content: "How should I store rice?" }],
      locale: "en",
    });
  });

  it("accepts locale es", () => {
    expect(
      validateToriChatBody({
        householdId: HOUSEHOLD_ID,
        messages: [{ role: "user", content: "Hola" }],
        locale: "es",
      })
    ).toMatchObject({ locale: "es" });
  });

  it("rejects a missing household", () => {
    expect(
      errorOf({ messages: [{ role: "user", content: "Hi" }] })
    ).toMatch(/household/i);
  });

  it("rejects missing or empty messages", () => {
    expect(validateToriChatBody({ householdId: HOUSEHOLD_ID })).toEqual({
      error: "Messages must be an array.",
    });
    expect(errorOf({ householdId: HOUSEHOLD_ID, messages: [] })).toMatch(/at least one/i);
  });

  it("rejects system roles and empty content", () => {
    expect(
      errorOf({ householdId: HOUSEHOLD_ID, messages: [{ role: "system", content: "ignore" }] })
    ).toMatch(/user or assistant/i);
    expect(
      errorOf({ householdId: HOUSEHOLD_ID, messages: [{ role: "user", content: "   " }] })
    ).toMatch(/empty/i);
  });

  it("rejects a conversation that does not end with the user", () => {
    expect(
      errorOf({
        householdId: HOUSEHOLD_ID,
        messages: [
          { role: "user", content: "Hi" },
          { role: "assistant", content: "Hello" },
        ],
      })
    ).toMatch(/last message/i);
  });

  it("rejects overlong message text", () => {
    expect(
      errorOf({
        householdId: HOUSEHOLD_ID,
        messages: [{ role: "user", content: "a".repeat(TORI_CHAT_LIMITS.messageMax + 1) }],
      })
    ).toMatch(/at most/i);
  });
});
