import { describe, expect, it } from "vitest";
import type { Folder, Item } from "../api/client";
import { createInventoryPdf } from "./inventoryPdf";

describe("createInventoryPdf", () => {
  it("builds a multi-page landscape report for a sizable inventory", async () => {
    const folders: Folder[] = [
      {
        id: "f1",
        householdId: "h1",
        name: "Pantry",
        category: "Unrefrigerated Food",
        creationDate: null,
      },
      {
        id: "f2",
        householdId: "h1",
        name: "Tech",
        category: "Electronics",
        creationDate: null,
      },
    ];
    const items: Item[] = Array.from({ length: 45 }, (_, i) => ({
      id: `i${i}`,
      householdId: "h1",
      folderId: i % 3 === 0 ? "f2" : i === 44 ? null : "f1",
      name: `Item ${i}`,
      location: i % 2 ? "Cabinet" : "Desk",
      purchaseDate: "2026-01-01",
      expirationDate: i % 5 === 0 ? "2026-08-01" : "2026-12-01",
      quantity: (i % 4) + 1,
      price: i % 7 === 0 ? null : String((i + 1) * 3.5),
      tags: i % 2 ? ["tag-a"] : ["tag-b", "tag-c"],
      imageUrl: null,
    }));

    const bytes = await createInventoryPdf({
      householdName: "Glickman Home",
      folders,
      items,
    });

    expect(bytes.byteLength).toBeGreaterThan(2000);
    expect(String.fromCharCode(...bytes.slice(0, 4))).toBe("%PDF");
  });
});
