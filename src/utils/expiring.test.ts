import { beforeEach, describe, expect, it } from "vitest";
import type { Item } from "../api/client";
import {
  DEFAULT_EXPIRING_THRESHOLD,
  EXPIRING_THRESHOLD_KEY,
  expirationLabel,
  filterExpiringItems,
  readExpiringThreshold,
  writeExpiringThreshold,
} from "./expiring";

const item = (overrides: Partial<Item>): Item => ({
  id: "1",
  householdId: "h",
  folderId: null,
  name: "Milk",
  location: null,
  purchaseDate: null,
  expirationDate: null,
  quantity: 1,
  price: null,
  tags: [],
  imageUrl: null,
  ...overrides,
});

describe("expiring utils", () => {
  const today = new Date(2026, 7, 9);

  beforeEach(() => {
    localStorage.clear();
  });

  it("persists and validates the warning threshold", () => {
    expect(readExpiringThreshold()).toBe(DEFAULT_EXPIRING_THRESHOLD);
    writeExpiringThreshold(14);
    expect(localStorage.getItem(EXPIRING_THRESHOLD_KEY)).toBe("14");
    expect(readExpiringThreshold()).toBe(14);
    localStorage.setItem(EXPIRING_THRESHOLD_KEY, "nope");
    expect(readExpiringThreshold()).toBe(DEFAULT_EXPIRING_THRESHOLD);
  });

  it("includes overdue and within threshold, sorted urgent first", () => {
    const items = [
      item({ id: "a", expirationDate: "2026-08-20", name: "Later" }),
      item({ id: "b", expirationDate: "2026-08-05", name: "Overdue" }),
      item({ id: "c", expirationDate: "2026-08-10", name: "Soon" }),
      item({ id: "d", expirationDate: null, name: "None" }),
    ];
    const result = filterExpiringItems(items, 7, today);
    expect(result.map((i) => i.id)).toEqual(["b", "c"]);
  });

  it("supports 0-day threshold (today and overdue only)", () => {
    const items = [
      item({ id: "a", expirationDate: "2026-08-09" }),
      item({ id: "b", expirationDate: "2026-08-10" }),
      item({ id: "c", expirationDate: "2026-08-01" }),
    ];
    const result = filterExpiringItems(items, 0, today);
    expect(result.map((i) => i.id)).toEqual(["c", "a"]);
  });

  it("labels expiration clearly", () => {
    expect(expirationLabel("2026-08-01", today)).toBe("Overdue");
    expect(expirationLabel("2026-08-09", today)).toBe("Today");
    expect(expirationLabel("2026-08-10", today)).toBe("1 day");
    expect(expirationLabel("2026-08-12", today)).toBe("3 days");
  });
});
