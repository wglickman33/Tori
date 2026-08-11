import MiniSearch from "minisearch";
import type { Folder, Item } from "../api/client";
import { folderLabel } from "./inventoryFilters";

export type InventorySearchDoc = {
  id: string;
  name: string;
  tags: string;
  folderName: string;
  category: string;
  location: string;
  price: string;
};

export function toSearchDoc(item: Item, folders: Folder[]): InventorySearchDoc {
  const folder = item.folderId ? folders.find((f) => f.id === item.folderId) : undefined;
  return {
    id: item.id,
    name: item.name,
    tags: item.tags.join(" "),
    folderName: folderLabel(folders, item.folderId),
    category: folder?.category ?? "",
    location: item.location?.trim() ?? "",
    price: item.price ?? "",
  };
}

export function buildInventorySearchIndex(folders: Folder[], items: Item[]): MiniSearch<InventorySearchDoc> {
  const mini = new MiniSearch<InventorySearchDoc>({
    fields: ["name", "tags", "folderName", "category", "location", "price"],
    storeFields: ["id"],
    searchOptions: {
      boost: {
        name: 6,
        tags: 3,
        folderName: 2,
        category: 2,
        location: 2,
        price: 1,
      },
      fuzzy: 0.2,
      prefix: true,
      combineWith: "AND",
    },
  });
  mini.addAll(items.map((item) => toSearchDoc(item, folders)));
  return mini;
}

/**
 * Ranked text search. Empty/whitespace query returns null so the caller can
 * fall back to the full item list (browse mode).
 */
export function searchInventoryIds(
  index: MiniSearch<InventorySearchDoc>,
  query: string
): string[] | null {
  const q = query.trim();
  if (!q) return null;
  return index.search(q).map((hit) => String(hit.id));
}

export function searchInventory(
  index: MiniSearch<InventorySearchDoc>,
  query: string,
  itemsById: Map<string, Item>
): Item[] | null {
  const ids = searchInventoryIds(index, query);
  if (ids === null) return null;
  return ids.map((id) => itemsById.get(id)).filter((item): item is Item => Boolean(item));
}
