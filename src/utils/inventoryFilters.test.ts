import { describe, expect, it } from "vitest";
import type { Item } from "../api/client";
import {
  INDEPENDENT_FOLDER_KEY,
  buildTagRows,
  computeDashboardStats,
  daysUntilExpiration,
  filterItems,
} from "./inventoryFilters";

const baseItem = (overrides: Partial<Item>): Item => ({
  id: "i1",
  householdId: "h1",
  folderId: null,
  name: "Milk",
  location: null,
  purchaseDate: null,
  expirationDate: null,
  quantity: 1,
  price: "3.50",
  tags: ["dairy"],
  imageUrl: null,
  ...overrides,
});

describe("inventoryFilters", () => {
  it("ANDs folder/name/tag/price filters and excludes null prices when bounded", () => {
    const items = [
      baseItem({ id: "1", name: "Milk", folderId: "f1", price: "3.50", tags: ["dairy"] }),
      baseItem({ id: "2", name: "Rice", folderId: null, price: null, tags: ["grain"] }),
      baseItem({ id: "3", name: "Milk", folderId: "f1", price: "10.00", tags: ["dairy", "cold"] }),
    ];

    const result = filterItems(items, {
      folderIds: ["f1"],
      names: ["Milk"],
      tags: ["dairy"],
      minPrice: 4,
      maxPrice: 20,
    });

    expect(result.map((i) => i.id)).toEqual(["3"]);
  });

  it("treats independent folder sentinel correctly", () => {
    const items = [baseItem({ id: "1", folderId: null }), baseItem({ id: "2", folderId: "f1" })];
    const result = filterItems(items, {
      folderIds: [INDEPENDENT_FOLDER_KEY],
      names: [],
      tags: [],
      minPrice: null,
      maxPrice: null,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("1");
  });

  it("returns zero results for impossible combinations", () => {
    const items = [baseItem({ tags: ["a"] })];
    const result = filterItems(items, {
      folderIds: [],
      names: [],
      tags: ["missing"],
      minPrice: null,
      maxPrice: null,
    });
    expect(result).toHaveLength(0);
  });

  it("computes days until expiration and dashboard totals with null prices", () => {
    expect(daysUntilExpiration("2026-08-16", new Date(2026, 7, 9))).toBe(7);
    expect(daysUntilExpiration(null)).toBeNull();

    const stats = computeDashboardStats(
      [{ id: "f1", householdId: "h1", name: "Pantry", category: "Tools", creationDate: null }],
      [
        baseItem({ id: "1", quantity: 2, price: "5.00", expirationDate: "2026-08-10" }),
        baseItem({ id: "2", quantity: 3, price: null, expirationDate: null }),
      ],
      new Date(2026, 7, 9)
    );

    expect(stats.folderCount).toBe(1);
    expect(stats.itemCount).toBe(2);
    expect(stats.totalQuantity).toBe(5);
    expect(stats.totalValue).toBe(5);
    expect(stats.itemsMissingPrice).toBe(1);
    expect(stats.expiringSoonCount).toBe(1);
  });

  it("builds tag rows across items", () => {
    const rows = buildTagRows([
      baseItem({ id: "1", tags: ["a", "b"] }),
      baseItem({ id: "2", tags: ["a"] }),
    ]);
    expect(rows.find((r) => r.tag === "a")?.itemCount).toBe(2);
    expect(rows.find((r) => r.tag === "b")?.itemIds).toEqual(["1"]);
  });
});
