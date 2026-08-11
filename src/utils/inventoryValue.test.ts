import { describe, expect, it } from "vitest";
import type { Folder, Item } from "../api/client";
import {
  computeAttentionItems,
  computeCategoryCounts,
  computeDataGaps,
  computeInventoryValue,
  computeLocationCounts,
  lineValue,
  recentItems,
} from "./inventoryValue";

const folder = (overrides: Partial<Folder> = {}): Folder => ({
  id: "f1",
  householdId: "h1",
  name: "Pantry",
  category: "Unrefrigerated Food",
  creationDate: null,
  ...overrides,
});

const item = (overrides: Partial<Item> = {}): Item => ({
  id: "i1",
  householdId: "h1",
  folderId: "f1",
  name: "Rice",
  location: "Cabinet",
  purchaseDate: null,
  expirationDate: null,
  quantity: 2,
  price: "5.00",
  tags: [],
  imageUrl: null,
  ...overrides,
});

describe("inventoryValue", () => {
  it("uses price × quantity as line value", () => {
    expect(lineValue(item({ price: "5.00", quantity: 2 }))).toBe(10);
    expect(lineValue(item({ price: "1.32", quantity: 6 }))).toBeCloseTo(7.92);
    expect(lineValue(item({ price: null, quantity: 3 }))).toBeNull();
  });

  it("aggregates coverage and breakdowns from priced items only", () => {
    const folders = [
      folder(),
      folder({ id: "f2", name: "Tech", category: "Electronics" }),
    ];
    const items = [
      item({ id: "1", folderId: "f1", price: "5.00", quantity: 2, location: "Cabinet" }),
      item({
        id: "2",
        folderId: "f2",
        name: "Hub",
        price: "40",
        quantity: 1,
        location: "Desk",
        tags: ["tech"],
      }),
      item({ id: "3", folderId: null, name: "Tape", price: null, quantity: 4, location: null }),
    ];

    const summary = computeInventoryValue(folders, items);

    // 5×2 + 40×1 = 50
    expect(summary.coverage.totalValue).toBe(50);
    expect(summary.coverage.pricedCount).toBe(2);
    expect(summary.coverage.missingPriceCount).toBe(1);
    expect(summary.coverage.pricedShare).toBeCloseTo(2 / 3);
    expect(summary.byFolder[0]?.label).toBe("Tech");
    expect(summary.byFolder[0]?.totalValue).toBe(40);
    expect(summary.byFolder.find((r) => r.label === "Pantry")?.totalValue).toBe(10);
    expect(summary.byCategory.find((r) => r.label === "Electronics")?.totalValue).toBe(40);
    expect(summary.byLocation.find((r) => r.label === "Cabinet")?.totalValue).toBe(10);
    expect(summary.rows).toHaveLength(3);
    expect(summary.rows[0]?.item.id).toBe("2");
  });

  it("lists attention items by urgency within threshold", () => {
    const today = new Date(2026, 7, 10);
    const rows = computeAttentionItems(
      [
        item({ id: "a", expirationDate: "2026-08-12", name: "Soon" }),
        item({ id: "b", expirationDate: "2026-08-08", name: "Overdue" }),
        item({ id: "c", expirationDate: "2026-09-01", name: "Later" }),
        item({ id: "d", expirationDate: null, name: "None" }),
      ],
      7,
      today
    );
    expect(rows.map((r) => r.item.id)).toEqual(["b", "a"]);
    expect(rows[0]?.daysUntil).toBe(-2);
  });

  it("computes data gaps and only flags missing expiration on food folders", () => {
    const folders = [
      folder({ id: "food", name: "Fridge", category: "Refrigerated Food" }),
      folder({ id: "tech", name: "Tech", category: "Electronics" }),
    ];
    const gaps = computeDataGaps(
      [
        item({
          id: "1",
          folderId: "food",
          price: null,
          location: "A",
          expirationDate: "2026-01-01",
        }),
        item({
          id: "2",
          folderId: "food",
          name: "Milk",
          price: "1",
          location: null,
          expirationDate: null,
        }),
        item({
          id: "3",
          folderId: "tech",
          name: "Charger",
          price: "1",
          location: "B",
          expirationDate: null,
        }),
        item({
          id: "4",
          folderId: null,
          name: "Tape",
          price: "1",
          location: "B",
          expirationDate: null,
        }),
      ],
      folders
    );
    expect(gaps.missingPrice.map((i) => i.id)).toEqual(["1"]);
    expect(gaps.missingLocation.map((i) => i.id)).toEqual(["2"]);
    // Only the food-folder item without an expiry - not electronics or independent
    expect(gaps.missingExpiration.map((i) => i.id)).toEqual(["2"]);
  });

  it("counts locations and categories", () => {
    const folders = [folder(), folder({ id: "f2", name: "Tech", category: "Electronics" })];
    const items = [
      item({ id: "1", folderId: "f1", location: "Cabinet" }),
      item({ id: "2", folderId: "f1", location: "Cabinet" }),
      item({ id: "3", folderId: "f2", location: null }),
      item({ id: "4", folderId: null, location: "Desk" }),
    ];
    const locations = computeLocationCounts(items);
    expect(locations.unlocatedCount).toBe(1);
    expect(locations.rows[0]?.label).toBe("Cabinet");
    expect(locations.rows[0]?.count).toBe(2);

    const categories = computeCategoryCounts(folders, items);
    expect(categories.find((c) => c.label === "Unrefrigerated Food")?.count).toBe(2);
    expect(categories.find((c) => c.label === "Independent")?.count).toBe(1);
  });

  it("orders recent items by updatedAt then createdAt", () => {
    const rows = recentItems(
      [
        item({ id: "old", name: "Old", updatedAt: "2026-01-01T00:00:00.000Z" }),
        item({ id: "new", name: "New", updatedAt: "2026-08-01T00:00:00.000Z" }),
        item({ id: "mid", name: "Mid", createdAt: "2026-06-01T00:00:00.000Z" }),
      ],
      2
    );
    expect(rows.map((i) => i.id)).toEqual(["new", "mid"]);
  });
});
