import { describe, expect, it } from "vitest";
import { editDistance, isPluralPair, suggestTagMerges } from "./tagMergeSuggest";

describe("tagMergeSuggest", () => {
  it("detects simple plurals", () => {
    expect(isPluralPair("Bottle", "Bottles")).toBe(true);
    expect(isPluralPair("box", "boxes")).toBe(true);
    expect(isPluralPair("Water", "Dock")).toBe(false);
  });

  it("suggests Bottle / Bottles", () => {
    const suggestions = suggestTagMerges(["Bottle", "Bottles", "Water"]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.a).toBe("Bottle");
    expect(suggestions[0]?.b).toBe("Bottles");
    expect(suggestions[0]?.reason).toBe("plural");
  });

  it("suggests near typos", () => {
    const suggestions = suggestTagMerges(["Charger", "Charge", "Dock"]);
    expect(suggestions.some((s) => s.reason === "similar")).toBe(true);
    const pair = suggestions.find(
      (s) =>
        (s.a === "Charge" && s.b === "Charger") || (s.a === "Charger" && s.b === "Charge")
    );
    expect(pair).toBeTruthy();
  });

  it("suggests casing variants", () => {
    const suggestions = suggestTagMerges(["USB", "usb"]);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.reason).toBe("case");
  });

  it("does not suggest unrelated tags", () => {
    expect(suggestTagMerges(["Water", "Dock", "Cables", "Charger"])).toEqual([]);
  });

  it("pairs each tag at most once", () => {
    const suggestions = suggestTagMerges(["Bottle", "Bottles", "Bottl"]);
    const flat = suggestions.flatMap((s) => [s.a, s.b]);
    expect(new Set(flat).size).toBe(flat.length);
  });

  it("computes edit distance", () => {
    expect(editDistance("kitten", "sitting")).toBe(3);
    expect(editDistance("abc", "abc")).toBe(0);
  });
});
