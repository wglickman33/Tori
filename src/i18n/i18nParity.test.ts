import { describe, expect, it } from "vitest";
import en from "./en.json";
import es from "./es.json";

function leafKeys(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return leafKeys(value as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe("i18n parity", () => {
  it("keeps Tori AI card strings aligned between English and Spanish", () => {
    const enAi = leafKeys(en.ai as Record<string, unknown>);
    const esAi = leafKeys(es.ai as Record<string, unknown>);
    expect(esAi.sort()).toEqual(enAi.sort());
  });

  it("keeps Tori trace strings aligned between English and Spanish", () => {
    const enTrace = leafKeys(en.trace as Record<string, unknown>);
    const esTrace = leafKeys(es.trace as Record<string, unknown>);
    expect(esTrace.sort()).toEqual(enTrace.sort());
  });
});
