import { describe, expect, it } from "vitest";
import { expandBilingualQuery } from "./inventorySearchBilingual.js";

describe("expandBilingualQuery", () => {
  it("maps Spanish water bottle phrases to English", () => {
    const variants = expandBilingualQuery("botella de agua");
    expect(variants).toEqual(expect.arrayContaining(["botella de agua", "water bottle"]));
  });

  it("maps Spanish charger terms to English", () => {
    const variants = expandBilingualQuery("cargadores");
    expect(variants).toEqual(expect.arrayContaining(["cargadores", "chargers"]));
  });

  it("maps location presets both ways", () => {
    const variants = expandBilingualQuery("despensa");
    expect(variants).toEqual(expect.arrayContaining(["despensa", "pantry"]));
  });
});
