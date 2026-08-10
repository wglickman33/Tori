import { describe, expect, it } from "vitest";
import { buildInventoryCsv, csvEscape } from "./csv.js";
import type { Folder } from "../models/Folder.js";
import type { Item } from "../models/Item.js";

describe("csvEscape", () => {
  it("quotes values with commas, quotes, and newlines", () => {
    expect(csvEscape('Rice, "Basmati"')).toBe('"Rice, ""Basmati"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscape("plain")).toBe("plain");
  });
});

describe("buildInventoryCsv", () => {
  it("includes special characters safely", () => {
    const folders = [{ id: "f1", name: 'Pantry, "Main"' } as Folder];
    const items = [
      {
        id: "i1",
        householdId: "h1",
        folderId: "f1",
        name: 'Oil, "Extra"',
        location: "Shelf",
        quantity: 1,
        price: "4.50",
        purchaseDate: null,
        expirationDate: null,
        tags: ["cooking", "aisle,1"],
        imageUrl: null,
      } as Item,
    ];
    const csv = buildInventoryCsv(folders, items);
    expect(csv).toContain('"Oil, ""Extra"""');
    expect(csv).toContain('"Pantry, ""Main"""');
    expect(csv).toContain('"cooking; aisle,1"');
  });
});
