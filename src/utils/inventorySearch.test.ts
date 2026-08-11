import { describe, expect, it } from "vitest";
import type { Folder, Item } from "../api/client";
import { buildInventorySearchIndex, searchInventory } from "./inventorySearch";

const folders: Folder[] = [
  {
    id: "f1",
    householdId: "h1",
    name: "Tech Stuff",
    category: "Electronics",
    creationDate: null,
  },
  {
    id: "f2",
    householdId: "h1",
    name: "Pantry",
    category: "Unrefrigerated Food",
    creationDate: null,
  },
];

const items: Item[] = [
  {
    id: "1",
    householdId: "h1",
    folderId: "f1",
    name: "iPhone Charger",
    location: "Desk",
    purchaseDate: null,
    expirationDate: null,
    quantity: 1,
    price: "8.95",
    tags: ["Charger", "Cables"],
    imageUrl: null,
  },
  {
    id: "2",
    householdId: "h1",
    folderId: "f1",
    name: "Anker Hub",
    location: "Desk",
    purchaseDate: null,
    expirationDate: null,
    quantity: 1,
    price: "40",
    tags: ["Dock"],
    imageUrl: "/x.jpg",
  },
  {
    id: "3",
    householdId: "h1",
    folderId: "f2",
    name: "Water Bottle",
    location: "Pantry",
    purchaseDate: null,
    expirationDate: "2026-12-01",
    quantity: 2,
    price: "12",
    tags: ["Water"],
    imageUrl: null,
  },
];

describe("inventorySearch", () => {
  it("ranks name matches ahead of weaker fields", () => {
    const index = buildInventorySearchIndex(folders, items);
    const byId = new Map(items.map((i) => [i.id, i]));
    const hits = searchInventory(index, "charger", byId);
    expect(hits).not.toBeNull();
    expect(hits![0]?.id).toBe("1");
  });

  it("finds items via tags and fuzzy typos", () => {
    const index = buildInventorySearchIndex(folders, items);
    const byId = new Map(items.map((i) => [i.id, i]));
    const byTag = searchInventory(index, "dock", byId);
    expect(byTag?.map((i) => i.id)).toContain("2");

    const fuzzy = searchInventory(index, "ankr", byId);
    expect(fuzzy?.some((i) => i.id === "2")).toBe(true);
  });

  it("returns null for empty query (browse mode)", () => {
    const index = buildInventorySearchIndex(folders, items);
    const byId = new Map(items.map((i) => [i.id, i]));
    expect(searchInventory(index, "   ", byId)).toBeNull();
  });
});
