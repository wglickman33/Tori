import type { Folder, Item } from "../api/client";
import { DEFAULT_LOCATION_PRESETS } from "../constants/inventory";

export type SearchFilters = {
  folderIds: string[]; // includes "__independent__"
  names: string[];
  tags: string[];
  minPrice: number | null;
  maxPrice: number | null;
};

export const INDEPENDENT_FOLDER_KEY = "__independent__";
export const EXPIRING_SOON_DAYS = 7;

export function daysUntilExpiration(expirationDate: string | null, today = new Date()): number | null {
  if (!expirationDate) return null;
  const [y, m, d] = expirationDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export function parsePrice(price: string | null): number | null {
  if (price === null || price === undefined || price === "") return null;
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

export function filterItems(items: Item[], filters: SearchFilters): Item[] {
  return items.filter((item) => {
    const folderKey = item.folderId ?? INDEPENDENT_FOLDER_KEY;
    const folderMatch =
      filters.folderIds.length === 0 || filters.folderIds.includes(folderKey);

    const nameMatch = filters.names.length === 0 || filters.names.includes(item.name);

    const tagMatch =
      filters.tags.length === 0 || filters.tags.some((tag) => item.tags.includes(tag));

    const price = parsePrice(item.price);
    let priceMatch = true;
    if (filters.minPrice !== null || filters.maxPrice !== null) {
      if (price === null) priceMatch = false;
      else {
        if (filters.minPrice !== null && price < filters.minPrice) priceMatch = false;
        if (filters.maxPrice !== null && price > filters.maxPrice) priceMatch = false;
      }
    }

    return folderMatch && nameMatch && tagMatch && priceMatch;
  });
}

export function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

export function collectTags(items: Item[]): string[] {
  return uniqueSorted(items.flatMap((item) => item.tags));
}

export type TagRow = {
  tag: string;
  itemCount: number;
  itemIds: string[];
};

export function buildTagRows(items: Item[]): TagRow[] {
  const map = new Map<string, string[]>();
  for (const item of items) {
    for (const tag of item.tags) {
      const list = map.get(tag) ?? [];
      list.push(item.id);
      map.set(tag, list);
    }
  }
  return [...map.entries()]
    .map(([tag, itemIds]) => ({ tag, itemCount: itemIds.length, itemIds }))
    .sort((a, b) => a.tag.localeCompare(b.tag));
}

export type LocationRow = {
  location: string;
  itemCount: number;
  itemIds: string[];
};

export function buildLocationRows(items: Item[]): LocationRow[] {
  const map = new Map<string, string[]>();
  for (const item of items) {
    const location = item.location?.trim();
    if (!location) continue;
    const list = map.get(location) ?? [];
    list.push(item.id);
    map.set(location, list);
  }
  return [...map.entries()]
    .map(([location, itemIds]) => ({ location, itemCount: itemIds.length, itemIds }))
    .sort((a, b) => a.location.localeCompare(b.location));
}

/**
 * Household presets ∪ used locations not already listed, with Custom last.
 * Falls back to DEFAULT_LOCATION_PRESETS when presets are unset (null/undefined).
 */
export function buildLocationSelectOptions(
  presets: string[] | null | undefined,
  usedLocations: string[] = []
): string[] {
  const ordered =
    presets == null
      ? [...DEFAULT_LOCATION_PRESETS]
      : presets
          .map((loc) => loc.trim())
          .filter((loc) => loc && loc !== "Custom")
          .filter((loc, i, arr) => arr.findIndex((x) => x.toLowerCase() === loc.toLowerCase()) === i);
  const presetSet = new Set(ordered.map((loc) => loc.toLowerCase()));
  const extras = uniqueSorted(
    usedLocations
      .map((loc) => loc.trim())
      .filter((loc) => loc && loc !== "Custom" && !presetSet.has(loc.toLowerCase()))
  );
  return [...ordered, ...extras, "Custom"];
}

export type ManagedLocationRow = {
  location: string;
  itemCount: number;
  itemIds: string[];
  /** True when present on items but not in household presets. */
  orphan: boolean;
};

/** Presets (household order) plus orphan in-use locations. */
export function buildManagedLocationRows(
  presets: string[] | null | undefined,
  items: Item[]
): ManagedLocationRow[] {
  const usage = buildLocationRows(items);
  const usageMap = new Map(usage.map((row) => [row.location.toLowerCase(), row]));
  const orderedPresets =
    presets == null
      ? [...DEFAULT_LOCATION_PRESETS]
      : presets
          .map((loc) => loc.trim())
          .filter(Boolean)
          .filter((loc, i, arr) => arr.findIndex((x) => x.toLowerCase() === loc.toLowerCase()) === i);

  const rows: ManagedLocationRow[] = orderedPresets.map((location) => {
    const hit = usageMap.get(location.toLowerCase());
    return {
      location,
      itemCount: hit?.itemCount ?? 0,
      itemIds: hit?.itemIds ?? [],
      orphan: false,
    };
  });

  const presetKeys = new Set(orderedPresets.map((loc) => loc.toLowerCase()));
  for (const row of usage) {
    if (presetKeys.has(row.location.toLowerCase())) continue;
    rows.push({
      location: row.location,
      itemCount: row.itemCount,
      itemIds: row.itemIds,
      orphan: true,
    });
  }
  return rows;
}

export type DashboardStats = {
  folderCount: number;
  itemCount: number;
  totalQuantity: number;
  /** Sum of (price × quantity) for priced items only. */
  totalValue: number;
  itemsMissingPrice: number;
  itemsWithPrice: number;
  pricedShare: number;
  expiringSoonCount: number;
};

export function computeDashboardStats(
  folders: Folder[],
  items: Item[],
  today = new Date()
): DashboardStats {
  let totalQuantity = 0;
  let totalValue = 0;
  let itemsMissingPrice = 0;
  let itemsWithPrice = 0;
  let expiringSoonCount = 0;

  for (const item of items) {
    const qty = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
    totalQuantity += qty;
    const price = parsePrice(item.price);
    if (price === null) itemsMissingPrice += 1;
    else {
      itemsWithPrice += 1;
      totalValue += price * qty;
    }

    const days = daysUntilExpiration(item.expirationDate, today);
    if (days !== null && days <= EXPIRING_SOON_DAYS) expiringSoonCount += 1;
  }

  const itemCount = items.length;
  return {
    folderCount: folders.length,
    itemCount,
    totalQuantity,
    totalValue,
    itemsMissingPrice,
    itemsWithPrice,
    pricedShare: itemCount > 0 ? itemsWithPrice / itemCount : 0,
    expiringSoonCount,
  };
}

export function folderLabel(folders: Folder[], folderId: string | null): string {
  if (!folderId) return "Independent";
  return folders.find((f) => f.id === folderId)?.name ?? "Unknown folder";
}
