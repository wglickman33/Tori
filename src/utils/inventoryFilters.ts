import type { Folder, Item } from "../api/client";

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

export type DashboardStats = {
  folderCount: number;
  itemCount: number;
  totalQuantity: number;
  totalValue: number;
  itemsMissingPrice: number;
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
  let expiringSoonCount = 0;

  for (const item of items) {
    totalQuantity += item.quantity || 0;
    const price = parsePrice(item.price);
    if (price === null) itemsMissingPrice += 1;
    else totalValue += price;

    const days = daysUntilExpiration(item.expirationDate, today);
    if (days !== null && days <= EXPIRING_SOON_DAYS) expiringSoonCount += 1;
  }

  return {
    folderCount: folders.length,
    itemCount: items.length,
    totalQuantity,
    totalValue,
    itemsMissingPrice,
    expiringSoonCount,
  };
}

export function folderLabel(folders: Folder[], folderId: string | null): string {
  if (!folderId) return "Independent";
  return folders.find((f) => f.id === folderId)?.name ?? "Unknown folder";
}
