import MiniSearch from "minisearch";
import { expandBilingualQuery } from "./inventorySearchBilingual.js";

export type InventorySearchDoc = {
  id: string;
  name: string;
  tags: string;
  folderName: string;
  category: string;
  location: string;
  price: string;
};

function singularizeToken(token: string): string {
  const lower = token.toLowerCase();
  if (lower.endsWith("ies") && lower.length > 4) return `${lower.slice(0, -3)}y`;
  if (
    lower.endsWith("ses") ||
    lower.endsWith("xes") ||
    lower.endsWith("zes") ||
    lower.endsWith("ches") ||
    lower.endsWith("shes")
  ) {
    return lower.slice(0, -2);
  }
  // ...les plurals: bottles, tables
  if (lower.endsWith("les") && lower.length > 4) {
    return lower.slice(0, -1);
  }
  // ...ers/.ors plurals: chargers, computers (when token ends in -ers/-ors)
  if ((lower.endsWith("ers") || lower.endsWith("ors")) && lower.length > 4) {
    return lower.slice(0, -1);
  }
  // Spanish (and some English) consonant + es plurals: cargadores, dishes
  if (lower.endsWith("es") && lower.length > 4) {
    return lower.slice(0, -2);
  }
  if (lower.endsWith("s") && lower.length > 2 && !lower.endsWith("ss")) {
    return lower.slice(0, -1);
  }
  return lower;
}

/** Plural + bilingual variants so "botella de agua" matches "Water Bottle". */
export function searchQueryVariants(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const variants = new Set<string>();
  for (const base of expandBilingualQuery(trimmed)) {
    variants.add(base);
    const tokens = base.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      variants.add(tokens.map(singularizeToken).join(" "));
      if (tokens.length === 1) {
        variants.add(singularizeToken(tokens[0]!));
      }
    }
  }
  return [...variants];
}

export function buildInventorySearchIndex(docs: InventorySearchDoc[]): MiniSearch<InventorySearchDoc> {
  const mini = new MiniSearch<InventorySearchDoc>({
    fields: ["name", "tags", "folderName", "category", "location", "price"],
    storeFields: ["id"],
    searchOptions: {
      boost: { name: 6, tags: 3, folderName: 2, category: 2, location: 2, price: 1 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: "AND",
    },
  });
  if (docs.length > 0) mini.addAll(docs);
  return mini;
}

export function searchInventoryDocIds(index: MiniSearch<InventorySearchDoc>, query: string): string[] {
  const variants = searchQueryVariants(query);
  if (variants.length === 0) return [];

  const scores = new Map<string, number>();
  for (const variant of variants) {
    for (const hit of index.search(variant)) {
      const id = String(hit.id);
      scores.set(id, Math.max(scores.get(id) ?? 0, hit.score));
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}
