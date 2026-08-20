import { Folder, Item } from "../models/index.js";
import { getMembership } from "./householdAccess.js";
import type { GroqToolDefinition } from "./groqChat.js";
import {
  formatZodError,
  isValidUuid,
  itemSchema,
  itemUpdateSchema,
} from "./validation.js";

const SEARCH_LIMIT = 20;
const DEFAULT_EXPIRING_DAYS = 7;
const MAX_EXPIRING_DAYS = 365;
const WRITE_NOTE =
  "This is proposed only. The user must tap Confirm in the chat. Do not say you already saved or deleted anything.";

export type ToriProposedItem = {
  name: string;
  quantity: number;
  location: string | null;
  folderId: string | null;
  expirationDate: string | null;
  purchaseDate: string | null;
  tags: string[];
  price: string | null;
};

export type ToriPendingAction =
  | { type: "add_item"; item: ToriProposedItem }
  | { type: "update_item"; itemId: string; itemName: string; patch: Partial<ToriProposedItem> }
  | { type: "delete_item"; itemId: string; itemName: string };

export const TORI_TOOLS: GroqToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "search_items",
      description:
        "Search the current household inventory by item name, tags, location, or folder name. Use this when they ask whether they have something or where it is.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search text, e.g. milk, paper towels, fridge, or a tag." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_item",
      description: "Get one household item by id returned from another tool. Never invent an id.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "Item id from search_items or similar." },
        },
        required: ["item_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_expiring",
      description:
        "List household items that are overdue or expiring within a number of days. Only items with an expiration date are included.",
      parameters: {
        type: "object",
        properties: {
          within_days: {
            type: "number",
            description: "Days ahead to include. Defaults to 7. Use 0 for today and overdue only.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_locations",
      description: "List distinct item locations in the household and how many items are in each.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "items_in_location",
      description: "List items stored in a location, e.g. Fridge or Pantry.",
      parameters: {
        type: "object",
        properties: {
          location: { type: "string", description: "Location name from list_locations or the user." },
        },
        required: ["location"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tags",
      description: "List tags used on household items and how many items have each tag.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "items_with_tag",
      description: "List items that have a given tag.",
      parameters: {
        type: "object",
        properties: {
          tag: { type: "string", description: "Tag label from list_tags or the user." },
        },
        required: ["tag"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory_value",
      description:
        "Sum recorded household value as unit price times quantity. Items without a price are counted as missing, never guessed.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_folders",
      description: "List inventory folders in the household.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_add_item",
      description:
        "Propose adding an item. This does not save anything. The user must confirm in the chat. Never claim the item was added. Search first if they asked to add only when missing.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          location: { type: "string" },
          folderId: { type: "string" },
          expirationDate: { type: "string", description: "YYYY-MM-DD" },
          tags: { type: "array", items: { type: "string" } },
          price: { type: "number" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_update_item",
      description:
        "Propose updating an existing item by id. This does not save anything. The user must confirm in the chat.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string" },
          name: { type: "string" },
          quantity: { type: "number" },
          location: { type: "string" },
          folderId: { type: "string" },
          expirationDate: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          price: { type: "number" },
        },
        required: ["item_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "propose_delete_item",
      description:
        "Propose deleting an existing item by id. This does not delete anything. The user must confirm in the chat.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string" },
        },
        required: ["item_id"],
      },
    },
  },
];

export function daysUntilExpiration(expirationDate: string | null, today = new Date()): number | null {
  if (!expirationDate) return null;
  const [y, m, d] = expirationDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

type ItemRow = {
  id: string;
  name: string;
  location: string | null;
  folderId: string | null;
  folderName: string | null;
  tags: string[];
  quantity: number;
  price: string | null;
  expirationDate: string | null;
  purchaseDate: string | null;
};

function parsePrice(price: string | null): number | null {
  if (price === null || price === undefined || price === "") return null;
  const n = Number(price);
  return Number.isFinite(n) ? n : null;
}

function summarizeItem(item: Item, folderName: string | null): ItemRow {
  return {
    id: item.id,
    name: item.name,
    location: item.location,
    folderId: item.folderId,
    folderName,
    tags: item.tags ?? [],
    quantity: item.quantity,
    price: item.price === null || item.price === undefined ? null : String(item.price),
    expirationDate: item.expirationDate,
    purchaseDate: item.purchaseDate,
  };
}

function matchesQuery(item: ItemRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (item.name.toLowerCase().includes(q)) return true;
  if (item.location?.toLowerCase().includes(q)) return true;
  if (item.folderName?.toLowerCase().includes(q)) return true;
  if (item.tags.some((tag) => tag.toLowerCase().includes(q))) return true;
  return false;
}

function locationKey(location: string | null): string {
  const trimmed = location?.trim() ?? "";
  return trimmed ? trimmed.toLowerCase() : "";
}

async function assertHouseholdAccess(userId: string, householdId: string): Promise<string | null> {
  const membership = await getMembership(householdId, userId);
  if (!membership) return JSON.stringify({ error: "Forbidden" });
  return null;
}

async function loadHouseholdItems(householdId: string): Promise<ItemRow[]> {
  const [items, folders] = await Promise.all([
    Item.findAll({ where: { householdId }, order: [["name", "ASC"]] }),
    Folder.findAll({ where: { householdId } }),
  ]);
  const folderNames = new Map(folders.map((folder) => [folder.id, folder.name]));
  return items.map((item) => summarizeItem(item, item.folderId ? folderNames.get(item.folderId) ?? null : null));
}

function proposedFromParsed(parsed: {
  name: string;
  quantity: number;
  location: string | null;
  folderId: string | null;
  expirationDate: string | null;
  purchaseDate?: string | null;
  tags: string[];
  price: string | null;
}): ToriProposedItem {
  return {
    name: parsed.name,
    quantity: parsed.quantity,
    location: parsed.location,
    folderId: parsed.folderId,
    expirationDate: parsed.expirationDate,
    purchaseDate: parsed.purchaseDate ?? null,
    tags: parsed.tags,
    price: parsed.price,
  };
}

export async function searchItems(userId: string, householdId: string, query: string): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const items = await loadHouseholdItems(householdId);
  const matches = items.filter((item) => matchesQuery(item, query)).slice(0, SEARCH_LIMIT);
  return JSON.stringify({ query: query.trim(), count: matches.length, items: matches });
}

export async function getItem(userId: string, householdId: string, itemId: string): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;
  if (!isValidUuid(itemId)) return JSON.stringify({ error: "Invalid item id." });

  const items = await loadHouseholdItems(householdId);
  const item = items.find((row) => row.id === itemId);
  if (!item) return JSON.stringify({ error: "Item not found." });
  return JSON.stringify({ item });
}

export async function getExpiring(
  userId: string,
  householdId: string,
  withinDays?: number,
  today = new Date()
): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const days = withinDays ?? DEFAULT_EXPIRING_DAYS;
  if (!Number.isFinite(days) || days < 0 || days > MAX_EXPIRING_DAYS) {
    return JSON.stringify({ error: "within_days must be between 0 and 365." });
  }

  const items = await loadHouseholdItems(householdId);
  const expiring = items
    .map((item) => ({ item, daysUntil: daysUntilExpiration(item.expirationDate, today) }))
    .filter((row) => row.daysUntil !== null && row.daysUntil <= days)
    .sort((a, b) => (a.daysUntil ?? 0) - (b.daysUntil ?? 0))
    .map((row) => ({ ...row.item, daysUntil: row.daysUntil }));

  return JSON.stringify({ withinDays: days, count: expiring.length, items: expiring });
}

export async function listLocations(userId: string, householdId: string): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const items = await loadHouseholdItems(householdId);
  const counts = new Map<string, { location: string; count: number }>();
  for (const item of items) {
    const label = item.location?.trim() || "No location";
    const key = locationKey(item.location);
    const prev = counts.get(key) ?? { location: label, count: 0 };
    prev.count += 1;
    counts.set(key, prev);
  }
  const locations = [...counts.values()].sort((a, b) => a.location.localeCompare(b.location));
  return JSON.stringify({ count: locations.length, locations });
}

export async function itemsInLocation(userId: string, householdId: string, location: string): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const wanted = locationKey(location);
  const items = (await loadHouseholdItems(householdId)).filter((item) => locationKey(item.location) === wanted);
  return JSON.stringify({ location: location.trim(), count: items.length, items });
}

export async function listTags(userId: string, householdId: string): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const items = await loadHouseholdItems(householdId);
  const counts = new Map<string, { tag: string; count: number }>();
  for (const item of items) {
    for (const tag of item.tags) {
      const label = tag.trim();
      if (!label) continue;
      const key = label.toLowerCase();
      const prev = counts.get(key) ?? { tag: label, count: 0 };
      prev.count += 1;
      counts.set(key, prev);
    }
  }
  const tags = [...counts.values()].sort((a, b) => a.tag.localeCompare(b.tag));
  return JSON.stringify({ count: tags.length, tags });
}

export async function itemsWithTag(userId: string, householdId: string, tag: string): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const wanted = tag.trim().toLowerCase();
  const items = (await loadHouseholdItems(householdId)).filter((item) =>
    item.tags.some((value) => value.trim().toLowerCase() === wanted)
  );
  return JSON.stringify({ tag: tag.trim(), count: items.length, items });
}

export async function getInventoryValue(userId: string, householdId: string): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const items = await loadHouseholdItems(householdId);
  let pricedCount = 0;
  let missingPriceCount = 0;
  let totalValue = 0;
  for (const item of items) {
    const unit = parsePrice(item.price);
    if (unit === null) {
      missingPriceCount += 1;
      continue;
    }
    pricedCount += 1;
    totalValue += unit * item.quantity;
  }
  return JSON.stringify({
    itemCount: items.length,
    pricedCount,
    missingPriceCount,
    totalValue: Math.round(totalValue * 100) / 100,
  });
}

export async function listFolders(userId: string, householdId: string): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const [folders, items] = await Promise.all([
    Folder.findAll({ where: { householdId }, order: [["name", "ASC"]] }),
    Item.findAll({ where: { householdId } }),
  ]);
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.folderId) continue;
    counts.set(item.folderId, (counts.get(item.folderId) ?? 0) + 1);
  }
  return JSON.stringify({
    count: folders.length,
    folders: folders.map((folder) => ({
      id: folder.id,
      name: folder.name,
      category: folder.category,
      itemCount: counts.get(folder.id) ?? 0,
    })),
  });
}

async function assertFolderInHousehold(householdId: string, folderId: string | null): Promise<string | null> {
  if (!folderId) return null;
  const folder = await Folder.findOne({ where: { id: folderId, householdId } });
  if (!folder) return JSON.stringify({ error: "Folder not found in this household." });
  return null;
}

export async function proposeAddItem(
  userId: string,
  householdId: string,
  raw: Record<string, unknown>
): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;

  const parsed = itemSchema.safeParse(raw);
  if (!parsed.success) return JSON.stringify({ error: formatZodError(parsed.error) });
  const folderError = await assertFolderInHousehold(householdId, parsed.data.folderId ?? null);
  if (folderError) return folderError;

  const item = proposedFromParsed(parsed.data);
  return JSON.stringify({
    needsConfirmation: true,
    added: false,
    type: "add_item",
    item,
    message: WRITE_NOTE,
  });
}

export async function proposeUpdateItem(
  userId: string,
  householdId: string,
  itemId: string,
  raw: Record<string, unknown>
): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;
  if (!isValidUuid(itemId)) return JSON.stringify({ error: "Invalid item id." });

  const existing = await Item.findOne({ where: { id: itemId, householdId } });
  if (!existing) return JSON.stringify({ error: "Item not found." });

  const parsed = itemUpdateSchema.safeParse(raw);
  if (!parsed.success) return JSON.stringify({ error: formatZodError(parsed.error) });
  if (parsed.data.folderId !== undefined) {
    const folderError = await assertFolderInHousehold(householdId, parsed.data.folderId);
    if (folderError) return folderError;
  }

  const patch: Partial<ToriProposedItem> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.quantity !== undefined) patch.quantity = parsed.data.quantity;
  if (parsed.data.location !== undefined) patch.location = parsed.data.location;
  if (parsed.data.folderId !== undefined) patch.folderId = parsed.data.folderId;
  if (parsed.data.expirationDate !== undefined) patch.expirationDate = parsed.data.expirationDate;
  if (parsed.data.purchaseDate !== undefined) patch.purchaseDate = parsed.data.purchaseDate;
  if (parsed.data.tags !== undefined) patch.tags = parsed.data.tags;
  if (parsed.data.price !== undefined) patch.price = parsed.data.price;

  return JSON.stringify({
    needsConfirmation: true,
    added: false,
    type: "update_item",
    itemId: existing.id,
    itemName: existing.name,
    patch,
    message: WRITE_NOTE,
  });
}

export async function proposeDeleteItem(
  userId: string,
  householdId: string,
  itemId: string
): Promise<string> {
  const denied = await assertHouseholdAccess(userId, householdId);
  if (denied) return denied;
  if (!isValidUuid(itemId)) return JSON.stringify({ error: "Invalid item id." });

  const existing = await Item.findOne({ where: { id: itemId, householdId } });
  if (!existing) return JSON.stringify({ error: "Item not found." });

  return JSON.stringify({
    needsConfirmation: true,
    added: false,
    type: "delete_item",
    itemId: existing.id,
    itemName: existing.name,
    message: WRITE_NOTE,
  });
}

function isProposedItem(value: unknown): value is ToriProposedItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return typeof row.name === "string" && row.name.trim().length > 0 && typeof row.quantity === "number";
}

export function parseToriPendingAction(toolName: string, content: string): ToriPendingAction | undefined {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (parsed?.needsConfirmation !== true) return undefined;
    if (toolName === "propose_add_item" && parsed.type === "add_item" && isProposedItem(parsed.item)) {
      return { type: "add_item", item: parsed.item };
    }
    if (
      toolName === "propose_update_item" &&
      parsed.type === "update_item" &&
      typeof parsed.itemId === "string" &&
      typeof parsed.itemName === "string" &&
      parsed.patch &&
      typeof parsed.patch === "object"
    ) {
      return {
        type: "update_item",
        itemId: parsed.itemId,
        itemName: parsed.itemName,
        patch: parsed.patch as Partial<ToriProposedItem>,
      };
    }
    if (
      toolName === "propose_delete_item" &&
      parsed.type === "delete_item" &&
      typeof parsed.itemId === "string" &&
      typeof parsed.itemName === "string"
    ) {
      return { type: "delete_item", itemId: parsed.itemId, itemName: parsed.itemName };
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function executeToriTool(
  userId: string,
  householdId: string,
  name: string,
  rawArgs: string
): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    const parsed = rawArgs.trim() ? JSON.parse(rawArgs) : {};
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return JSON.stringify({ error: "Tool arguments must be an object." });
    }
    args = parsed as Record<string, unknown>;
  } catch {
    return JSON.stringify({ error: "Tool arguments were not valid JSON." });
  }

  if (name === "search_items") {
    return searchItems(userId, householdId, typeof args.query === "string" ? args.query : "");
  }
  if (name === "get_item") {
    return getItem(userId, householdId, typeof args.item_id === "string" ? args.item_id : "");
  }
  if (name === "get_expiring") {
    return getExpiring(userId, householdId, typeof args.within_days === "number" ? args.within_days : undefined);
  }
  if (name === "list_locations") return listLocations(userId, householdId);
  if (name === "items_in_location") {
    return itemsInLocation(userId, householdId, typeof args.location === "string" ? args.location : "");
  }
  if (name === "list_tags") return listTags(userId, householdId);
  if (name === "items_with_tag") {
    return itemsWithTag(userId, householdId, typeof args.tag === "string" ? args.tag : "");
  }
  if (name === "get_inventory_value") return getInventoryValue(userId, householdId);
  if (name === "list_folders") return listFolders(userId, householdId);
  if (name === "propose_add_item") return proposeAddItem(userId, householdId, args);
  if (name === "propose_update_item") {
    const { item_id: _itemId, ...patch } = args;
    return proposeUpdateItem(userId, householdId, typeof args.item_id === "string" ? args.item_id : "", patch);
  }
  if (name === "propose_delete_item") {
    return proposeDeleteItem(userId, householdId, typeof args.item_id === "string" ? args.item_id : "");
  }
  return JSON.stringify({ error: `Unknown tool: ${name}` });
}
