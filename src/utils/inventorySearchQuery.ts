import type { Folder, Item } from "../api/client";
import { readExpiringThreshold } from "./expiring";
import {
  daysUntilExpiration,
  folderLabel,
  INDEPENDENT_FOLDER_KEY,
  parsePrice,
} from "./inventoryFilters";
import { buildInventorySearchIndex, searchInventory } from "./inventorySearch";

export const NO_LOCATION_KEY = "__no_location__";

export type ExpirationFilter = "any" | "has" | "missing" | "expiring" | "overdue";
export type PhotoFilter = "any" | "yes" | "no";
export type SearchSort = "relevance" | "name" | "price" | "expiry";

export type InventorySearchFilters = {
  query: string;
  folderIds: string[];
  tags: string[];
  categories: string[];
  locations: string[];
  minPrice: number | null;
  maxPrice: number | null;
  expiration: ExpirationFilter;
  hasPhoto: PhotoFilter;
};

export function emptyInventorySearchFilters(): InventorySearchFilters {
  return {
    query: "",
    folderIds: [],
    tags: [],
    categories: [],
    locations: [],
    minPrice: null,
    maxPrice: null,
    expiration: "any",
    hasPhoto: "any",
  };
}

export function applyInventoryFacets(
  items: Item[],
  folders: Folder[],
  filters: InventorySearchFilters,
  today = new Date(),
  thresholdDays = readExpiringThreshold()
): Item[] {
  const folderById = new Map(folders.map((f) => [f.id, f]));

  return items.filter((item) => {
    const folderKey = item.folderId ?? INDEPENDENT_FOLDER_KEY;
    if (filters.folderIds.length > 0 && !filters.folderIds.includes(folderKey)) return false;

    if (
      filters.tags.length > 0 &&
      !filters.tags.some((tag) => item.tags.includes(tag))
    ) {
      return false;
    }

    if (filters.categories.length > 0) {
      const category = item.folderId
        ? folderById.get(item.folderId)?.category ?? "Uncategorized"
        : "Independent";
      if (!filters.categories.includes(category)) return false;
    }

    if (filters.locations.length > 0) {
      const locKey = item.location?.trim() ? item.location.trim() : NO_LOCATION_KEY;
      // Locations may be stored as display strings; match case-sensitively on exact value
      // except the sentinel for missing location.
      const matchesLocation = filters.locations.some((loc) => {
        if (loc === NO_LOCATION_KEY) return locKey === NO_LOCATION_KEY;
        return locKey === loc;
      });
      if (!matchesLocation) return false;
    }

    const price = parsePrice(item.price);
    if (filters.minPrice !== null || filters.maxPrice !== null) {
      if (price === null) return false;
      if (filters.minPrice !== null && price < filters.minPrice) return false;
      if (filters.maxPrice !== null && price > filters.maxPrice) return false;
    }

    const days = daysUntilExpiration(item.expirationDate, today);
    switch (filters.expiration) {
      case "has":
        if (days === null) return false;
        break;
      case "missing":
        if (days !== null) return false;
        break;
      case "expiring":
        if (days === null || days > thresholdDays) return false;
        break;
      case "overdue":
        if (days === null || days >= 0) return false;
        break;
      default:
        break;
    }

    if (filters.hasPhoto === "yes" && !item.imageUrl) return false;
    if (filters.hasPhoto === "no" && item.imageUrl) return false;

    return true;
  });
}

export function sortInventoryResults(
  items: Item[],
  sort: SearchSort,
  today = new Date()
): Item[] {
  const copy = [...items];
  switch (sort) {
    case "price":
      return copy.sort((a, b) => {
        const ap = parsePrice(a.price);
        const bp = parsePrice(b.price);
        if (ap === null && bp === null) return a.name.localeCompare(b.name);
        if (ap === null) return 1;
        if (bp === null) return -1;
        if (ap !== bp) return ap - bp;
        return a.name.localeCompare(b.name);
      });
    case "expiry":
      return copy.sort((a, b) => {
        const ad = daysUntilExpiration(a.expirationDate, today);
        const bd = daysUntilExpiration(b.expirationDate, today);
        if (ad === null && bd === null) return a.name.localeCompare(b.name);
        if (ad === null) return 1;
        if (bd === null) return -1;
        if (ad !== bd) return ad - bd;
        return a.name.localeCompare(b.name);
      });
    case "relevance":
      // Preserve incoming order (search ranking).
      return copy;
    case "name":
    default:
      return copy.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export function runInventorySearch(
  folders: Folder[],
  items: Item[],
  filters: InventorySearchFilters,
  sort: SearchSort,
  today = new Date(),
  thresholdDays = readExpiringThreshold()
): Item[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  const index = buildInventorySearchIndex(folders, items);
  const searched = searchInventory(index, filters.query, itemsById);
  const base = searched ?? items;
  const faceted = applyInventoryFacets(base, folders, filters, today, thresholdDays);
  const effectiveSort = filters.query.trim() && sort === "relevance" ? "relevance" : sort === "relevance" ? "name" : sort;
  // When there was a text query, `base` is already relevance-ordered; keep that if sort is relevance.
  if (searched && effectiveSort === "relevance") {
    return faceted; // filter preserves relative order of `base`
  }
  return sortInventoryResults(faceted, effectiveSort === "relevance" ? "name" : effectiveSort, today);
}

export function collectLocations(items: Item[]): string[] {
  return [...new Set(items.map((i) => i.location?.trim()).filter(Boolean) as string[])].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function collectCategories(folders: Folder[], items: Item[]): string[] {
  const folderById = new Map(folders.map((f) => [f.id, f]));
  const set = new Set<string>();
  for (const item of items) {
    if (!item.folderId) {
      set.add("Independent");
      continue;
    }
    set.add(folderById.get(item.folderId)?.category?.trim() || "Uncategorized");
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function hasActiveInventoryFilters(filters: InventorySearchFilters): boolean {
  return Boolean(
    filters.query.trim() ||
      filters.folderIds.length ||
      filters.tags.length ||
      filters.categories.length ||
      filters.locations.length ||
      filters.minPrice !== null ||
      filters.maxPrice !== null ||
      filters.expiration !== "any" ||
      filters.hasPhoto !== "any"
  );
}

export function describeFolderFilter(folders: Folder[], folderId: string): string {
  if (folderId === INDEPENDENT_FOLDER_KEY) return "Independent";
  return folderLabel(folders, folderId);
}
