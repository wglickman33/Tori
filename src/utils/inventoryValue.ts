import type { Folder, Item } from "../api/client";
import { isFoodFolderCategory } from "../constants/inventory";
import { daysUntilExpiration, folderLabel, parsePrice } from "./inventoryFilters";
import { readExpiringThreshold } from "./expiring";

/**
 * Inventory worth helpers (fully open in product UI - no plan tiers).
 *
 * Recorded value = Price (per unit) × quantity.
 * Items without a price are excluded from totals.
 */

export function itemQuantity(item: Item): number {
  const q = item.quantity;
  if (!Number.isFinite(q) || q < 0) return 0;
  return q;
}

/** Line contribution: unit price × quantity. Null when price is missing. */
export function lineValue(item: Item): number | null {
  const price = parsePrice(item.price);
  if (price === null) return null;
  return price * itemQuantity(item);
}

export type ValueBreakdownRow = {
  key: string;
  label: string;
  itemCount: number;
  totalValue: number;
  share: number;
};

export type ValueCoverage = {
  itemCount: number;
  pricedCount: number;
  missingPriceCount: number;
  pricedShare: number;
  totalValue: number;
  totalQuantity: number;
};

export type ValueItemRow = {
  item: Item;
  folderName: string;
  /** Parsed unit Price field. */
  price: number | null;
  quantity: number;
  /** Unit price × quantity; null when price is missing. */
  lineValue: number | null;
};

export type InventoryValueSummary = {
  coverage: ValueCoverage;
  byFolder: ValueBreakdownRow[];
  byCategory: ValueBreakdownRow[];
  byLocation: ValueBreakdownRow[];
  rows: ValueItemRow[];
};

function pushBreakdown(
  map: Map<string, { label: string; itemCount: number; totalValue: number }>,
  key: string,
  label: string,
  value: number
) {
  const prev = map.get(key) ?? { label, itemCount: 0, totalValue: 0 };
  prev.itemCount += 1;
  prev.totalValue += value;
  map.set(key, prev);
}

function toSortedBreakdown(
  map: Map<string, { label: string; itemCount: number; totalValue: number }>,
  totalValue: number
): ValueBreakdownRow[] {
  return [...map.entries()]
    .map(([key, row]) => ({
      key,
      label: row.label,
      itemCount: row.itemCount,
      totalValue: row.totalValue,
      share: totalValue > 0 ? row.totalValue / totalValue : 0,
    }))
    .sort((a, b) => b.totalValue - a.totalValue || a.label.localeCompare(b.label));
}

export function computeInventoryValue(
  folders: Folder[],
  items: Item[]
): InventoryValueSummary {
  let pricedCount = 0;
  let missingPriceCount = 0;
  let totalValue = 0;
  let totalQuantity = 0;

  const byFolder = new Map<string, { label: string; itemCount: number; totalValue: number }>();
  const byCategory = new Map<string, { label: string; itemCount: number; totalValue: number }>();
  const byLocation = new Map<string, { label: string; itemCount: number; totalValue: number }>();
  const rows: ValueItemRow[] = [];

  const folderById = new Map(folders.map((f) => [f.id, f]));

  for (const item of items) {
    const qty = itemQuantity(item);
    totalQuantity += qty;
    const price = parsePrice(item.price);
    const line = lineValue(item);
    const folderName = folderLabel(folders, item.folderId);

    rows.push({
      item,
      folderName,
      price,
      quantity: qty,
      lineValue: line,
    });

    if (line === null || price === null) {
      missingPriceCount += 1;
      continue;
    }

    pricedCount += 1;
    totalValue += line;

    const folderKey = item.folderId ?? "__independent__";
    pushBreakdown(byFolder, folderKey, folderName, line);

    const folder = item.folderId ? folderById.get(item.folderId) : undefined;
    const category = folder?.category?.trim() || "Uncategorized";
    pushBreakdown(byCategory, category.toLowerCase(), category, line);

    const location = item.location?.trim() || "No location";
    pushBreakdown(byLocation, location.toLowerCase(), location, line);
  }

  const itemCount = items.length;
  rows.sort((a, b) => {
    const av = a.lineValue ?? -1;
    const bv = b.lineValue ?? -1;
    if (bv !== av) return bv - av;
    return a.item.name.localeCompare(b.item.name);
  });

  return {
    coverage: {
      itemCount,
      pricedCount,
      missingPriceCount,
      pricedShare: itemCount > 0 ? pricedCount / itemCount : 0,
      totalValue,
      totalQuantity,
    },
    byFolder: toSortedBreakdown(byFolder, totalValue),
    byCategory: toSortedBreakdown(byCategory, totalValue),
    byLocation: toSortedBreakdown(byLocation, totalValue),
    rows,
  };
}

export type AttentionItem = {
  item: Item;
  daysUntil: number;
};

export type DataGaps = {
  missingPrice: Item[];
  missingLocation: Item[];
  missingExpiration: Item[];
};

export type CountBreakdownRow = {
  key: string;
  label: string;
  count: number;
  share: number;
};

export function computeAttentionItems(
  items: Item[],
  thresholdDays = readExpiringThreshold(),
  today = new Date()
): AttentionItem[] {
  return items
    .map((item) => ({ item, daysUntil: daysUntilExpiration(item.expirationDate, today) }))
    .filter((row): row is AttentionItem => row.daysUntil !== null && row.daysUntil <= thresholdDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

export function computeDataGaps(items: Item[], folders: Folder[] = []): DataGaps {
  const missingPrice: Item[] = [];
  const missingLocation: Item[] = [];
  const missingExpiration: Item[] = [];
  const folderById = new Map(folders.map((f) => [f.id, f]));

  for (const item of items) {
    if (parsePrice(item.price) === null) missingPrice.push(item);
    if (!item.location?.trim()) missingLocation.push(item);

    // Expiration only matters for food folders (not electronics, tools, etc.)
    const folder = item.folderId ? folderById.get(item.folderId) : undefined;
    if (folder && isFoodFolderCategory(folder.category) && !item.expirationDate) {
      missingExpiration.push(item);
    }
  }

  const byName = (a: Item, b: Item) => a.name.localeCompare(b.name);
  missingPrice.sort(byName);
  missingLocation.sort(byName);
  missingExpiration.sort(byName);

  return { missingPrice, missingLocation, missingExpiration };
}

export function computeLocationCounts(items: Item[]): {
  rows: CountBreakdownRow[];
  unlocatedCount: number;
} {
  const map = new Map<string, { label: string; count: number }>();
  let unlocatedCount = 0;

  for (const item of items) {
    const location = item.location?.trim();
    if (!location) {
      unlocatedCount += 1;
      continue;
    }
    const key = location.toLowerCase();
    const prev = map.get(key) ?? { label: location, count: 0 };
    prev.count += 1;
    map.set(key, prev);
  }

  const located = items.length - unlocatedCount;
  const rows = [...map.entries()]
    .map(([key, row]) => ({
      key,
      label: row.label,
      count: row.count,
      share: located > 0 ? row.count / located : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  return { rows, unlocatedCount };
}

export function computeCategoryCounts(folders: Folder[], items: Item[]): CountBreakdownRow[] {
  const map = new Map<string, { label: string; count: number }>();
  const folderById = new Map(folders.map((f) => [f.id, f]));

  for (const item of items) {
    const folder = item.folderId ? folderById.get(item.folderId) : undefined;
    const category = folder?.category?.trim() || (item.folderId ? "Uncategorized" : "Independent");
    const key = category.toLowerCase();
    const prev = map.get(key) ?? { label: category, count: 0 };
    prev.count += 1;
    map.set(key, prev);
  }

  const total = items.length;
  return [...map.entries()]
    .map(([key, row]) => ({
      key,
      label: row.label,
      count: row.count,
      share: total > 0 ? row.count / total : 0,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function recentItems(items: Item[], limit = 10): Item[] {
  return [...items]
    .sort((a, b) => {
      const at = Date.parse(a.updatedAt ?? a.createdAt ?? "") || 0;
      const bt = Date.parse(b.updatedAt ?? b.createdAt ?? "") || 0;
      if (bt !== at) return bt - at;
      return a.name.localeCompare(b.name);
    })
    .slice(0, limit);
}

export function formatMoney(value: number): string {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function formatPercent(share: number): string {
  return `${Math.round(share * 100)}%`;
}
