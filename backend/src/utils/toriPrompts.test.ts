import { describe, expect, it } from "vitest";
import {
  buildToriAgentMessages,
  TORI_HARMONY_SYSTEM,
  TORI_SYSTEM_PROMPT,
  TORI_SYSTEM_PROMPT_ES,
} from "./toriPrompts.js";

describe("toriPrompts", () => {
  it("uses Harmony system shell with developer instructions", () => {
    const messages = buildToriAgentMessages("en", [{ role: "user", content: "Do we have milk?" }]);
    expect(messages[0]).toEqual({ role: "system", content: TORI_HARMONY_SYSTEM });
    expect(messages[0]?.content).toMatch(/Reasoning: low/);
    expect(messages[1]?.role).toBe("developer");
    expect(messages[1]?.content).toBe(TORI_SYSTEM_PROMPT);
    expect(messages[2]).toEqual({ role: "user", content: "Do we have milk?" });
  });

  it("selects Spanish developer instructions when locale is es", () => {
    const messages = buildToriAgentMessages("es", [{ role: "user", content: "¿Tenemos leche?" }]);
    expect(messages[1]?.content).toBe(TORI_SYSTEM_PROMPT_ES);
    expect(messages[1]?.content).toMatch(/español latinoamericano/i);
    expect(messages[1]?.content).toMatch(/cargadores → charger/i);
  });
});
