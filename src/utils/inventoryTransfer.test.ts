import { describe, expect, it } from "vitest";
import type { Folder, Item } from "../api/client";
import {
  inventoryToCsv,
  inventoryToToriFile,
  parseCsv,
  parseInventoryCsv,
  parseToriInventoryFile,
} from "./inventoryTransfer";

const folders: Folder[] = [
  {
    id: "f1",
    householdId: "h1",
    name: "Pantry",
    category: "Unrefrigerated Food",
    creationDate: null,
  },
];

const items: Item[] = [
  {
    id: "i1",
    householdId: "h1",
    folderId: "f1",
    name: "Oats",
    location: "Pantry",
    purchaseDate: null,
    expirationDate: "2026-12-01",
    quantity: 2,
    price: "3.50",
    tags: ["breakfast", "grain"],
    imageUrl: null,
  },
  {
    id: "i2",
    householdId: "h1",
    folderId: null,
    name: "Flashlight",
    location: "Garage",
    purchaseDate: null,
    expirationDate: null,
    quantity: 1,
    price: null,
    tags: [],
    imageUrl: null,
  },
];

describe("inventoryTransfer", () => {
  it("round-trips tori json envelope", () => {
    const file = inventoryToToriFile(folders, items, "Glickman Home");
    const parsed = parseToriInventoryFile(file);
    expect(parsed.format).toBe("tori-inventory");
    expect(parsed.folders).toHaveLength(1);
    expect(parsed.items[0]?.folderName).toBe("Pantry");
    expect(parsed.items[1]?.folderName).toBeNull();
    expect(parsed.items[0]?.tags).toEqual(["breakfast", "grain"]);
  });

  it("builds and parses csv", () => {
    const csv = inventoryToCsv(folders, items);
    expect(csv).toContain("Name,Folder,Location");
    expect(csv).toContain("Oats,Pantry,Pantry");
    const parsed = parseInventoryCsv(csv);
    expect(parsed.items).toHaveLength(2);
    expect(parsed.folders.map((f) => f.name)).toContain("Pantry");
    expect(parsed.items.find((i) => i.name === "Flashlight")?.folderName).toBeNull();
  });

  it("round-trips spanish csv headers", async () => {
    const i18n = (await import("../i18n")).default;
    await i18n.changeLanguage("es");
    try {
      const csv = inventoryToCsv(folders, items);
      expect(csv).toContain("Nombre,Carpeta,Ubicación");
      const parsed = parseInventoryCsv(csv);
      expect(parsed.items).toHaveLength(2);
      expect(parsed.items.find((i) => i.name === "Flashlight")?.folderName).toBeNull();
    } finally {
      await i18n.changeLanguage("en");
    }
  });

  it("parses quoted csv fields", () => {
    const rows = parseCsv('name,folder\n"Oats, steel-cut",Pantry\n');
    expect(rows[1]).toEqual(["Oats, steel-cut", "Pantry"]);
  });

  it("rejects unknown json format", () => {
    expect(() => parseToriInventoryFile({ format: "nope", version: 1 })).toThrow(/Unrecognized/);
  });
});
