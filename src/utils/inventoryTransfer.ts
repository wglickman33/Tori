import type { Folder, FolderInput, Item, ItemInput } from "../api/client";
import { downloadBlob, downloadJsonFile, downloadTextFile, slugifyFilename } from "./downloadFile";
import { createInventoryPdf } from "./inventoryPdf";

export const TORI_INVENTORY_FORMAT = "tori-inventory" as const;
export const TORI_INVENTORY_VERSION = 1 as const;

export interface ToriFolderPayload {
  name: string;
  category: string;
  creationDate?: string | null;
}

export interface ToriItemPayload {
  name: string;
  folderName?: string | null;
  location?: string | null;
  quantity: number;
  price?: string | null;
  purchaseDate?: string | null;
  expirationDate?: string | null;
  tags?: string[];
}

export interface ToriInventoryFile {
  format: typeof TORI_INVENTORY_FORMAT;
  version: typeof TORI_INVENTORY_VERSION;
  exportedAt: string;
  householdName?: string | null;
  folders: ToriFolderPayload[];
  items: ToriItemPayload[];
}

const CSV_HEADERS = [
  "name",
  "folder",
  "location",
  "quantity",
  "price",
  "purchaseDate",
  "expirationDate",
  "tags",
  "imageUrl",
] as const;

function csvEscape(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

/** Minimal RFC4180-ish CSV parser that supports quoted fields. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    // Ignore trailing empty line
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i]!;
    const next = input[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      pushCell();
      continue;
    }
    if (ch === "\n") {
      pushCell();
      pushRow();
      continue;
    }
    if (ch === "\r") continue;
    cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    pushCell();
    pushRow();
  }
  return rows;
}

function folderNameFor(folders: Folder[], folderId: string | null): string {
  if (!folderId) return "Independent";
  return folders.find((f) => f.id === folderId)?.name ?? "";
}

export function inventoryToToriFile(
  folders: Folder[],
  items: Item[],
  householdName?: string | null
): ToriInventoryFile {
  return {
    format: TORI_INVENTORY_FORMAT,
    version: TORI_INVENTORY_VERSION,
    exportedAt: new Date().toISOString(),
    householdName: householdName ?? null,
    folders: folders.map((folder) => ({
      name: folder.name,
      category: folder.category,
      creationDate: folder.creationDate,
    })),
    items: items.map((item) => ({
      name: item.name,
      folderName: item.folderId ? folderNameFor(folders, item.folderId) || null : null,
      location: item.location,
      quantity: item.quantity,
      price: item.price,
      purchaseDate: item.purchaseDate,
      expirationDate: item.expirationDate,
      tags: item.tags ?? [],
    })),
  };
}

export function inventoryToCsv(folders: Folder[], items: Item[]): string {
  const rows = items.map((item) =>
    [
      csvEscape(item.name),
      csvEscape(folderNameFor(folders, item.folderId)),
      csvEscape(item.location),
      csvEscape(item.quantity),
      csvEscape(item.price),
      csvEscape(item.purchaseDate),
      csvEscape(item.expirationDate),
      csvEscape((item.tags ?? []).join("; ")),
      csvEscape(item.imageUrl),
    ].join(",")
  );
  return `${CSV_HEADERS.join(",")}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
}

export function inventoryToPlainText(
  folders: Folder[],
  items: Item[],
  householdName?: string | null
): string {
  const lines: string[] = [
    "Tori inventory",
    householdName ? `Household: ${householdName}` : "Household inventory",
    `Exported: ${new Date().toLocaleString()}`,
    `Folders: ${folders.length} · Items: ${items.length}`,
    "",
  ];

  const byFolder = new Map<string, Item[]>();
  for (const item of items) {
    const key = folderNameFor(folders, item.folderId) || "Independent";
    const list = byFolder.get(key) ?? [];
    list.push(item);
    byFolder.set(key, list);
  }

  const folderOrder = [
    ...folders.map((f) => f.name),
    ...(byFolder.has("Independent") ? ["Independent"] : []),
  ];
  const seen = new Set<string>();
  for (const name of folderOrder) {
    if (seen.has(name)) continue;
    seen.add(name);
    const list = byFolder.get(name) ?? [];
    const folder = folders.find((f) => f.name === name);
    lines.push(`## ${name}${folder ? ` (${folder.category})` : ""}`);
    if (list.length === 0) {
      lines.push("(no items)");
      lines.push("");
      continue;
    }
    for (const item of list) {
      const bits = [
        `qty ${item.quantity}`,
        item.location || null,
        item.price ? `$${item.price}` : null,
        item.expirationDate ? `exp ${item.expirationDate}` : null,
        item.tags?.length ? `tags ${item.tags.join(", ")}` : null,
      ].filter(Boolean);
      lines.push(`- ${item.name}${bits.length ? ` · ${bits.join(" · ")}` : ""}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function optionalString(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value).trim() || null;
}

function parseQuantity(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error("Quantity must be a whole number of at least 1.");
  }
  return n;
}

function parseTags(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((t) => String(t).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[;,]/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function parseToriInventoryFile(raw: unknown): ToriInventoryFile {
  if (!raw || typeof raw !== "object") {
    throw new Error("Inventory file must be a JSON object.");
  }
  const data = raw as Record<string, unknown>;
  if (data.format !== TORI_INVENTORY_FORMAT) {
    throw new Error('Unrecognized file. Expected a Tori inventory export (format "tori-inventory").');
  }
  if (data.version !== TORI_INVENTORY_VERSION) {
    throw new Error(`Unsupported inventory file version: ${String(data.version)}`);
  }

  const foldersRaw = Array.isArray(data.folders) ? data.folders : [];
  const itemsRaw = Array.isArray(data.items) ? data.items : [];

  const folders: ToriFolderPayload[] = foldersRaw.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Folder #${index + 1} is invalid.`);
    }
    const folder = entry as Record<string, unknown>;
    return {
      name: assertString(folder.name, `Folder #${index + 1} name`),
      category: optionalString(folder.category) || "Custom",
      creationDate: optionalString(folder.creationDate),
    };
  });

  const items: ToriItemPayload[] = itemsRaw.map((entry, index) => {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Item #${index + 1} is invalid.`);
    }
    const item = entry as Record<string, unknown>;
    return {
      name: assertString(item.name, `Item #${index + 1} name`),
      folderName: optionalString(item.folderName),
      location: optionalString(item.location),
      quantity: parseQuantity(item.quantity ?? 1),
      price: optionalString(item.price),
      purchaseDate: optionalString(item.purchaseDate),
      expirationDate: optionalString(item.expirationDate),
      tags: parseTags(item.tags),
    };
  });

  if (folders.length === 0 && items.length === 0) {
    throw new Error("Inventory file has no folders or items.");
  }

  return {
    format: TORI_INVENTORY_FORMAT,
    version: TORI_INVENTORY_VERSION,
    exportedAt: typeof data.exportedAt === "string" ? data.exportedAt : new Date().toISOString(),
    householdName: optionalString(data.householdName),
    folders,
    items,
  };
}

export function parseInventoryCsv(text: string): ToriInventoryFile {
  const rows = parseCsv(text);
  if (rows.length < 2) {
    throw new Error("CSV must include a header row and at least one item.");
  }
  const header = rows[0]!.map((h) => h.trim().toLowerCase());
  const indexOf = (name: string) => header.indexOf(name.toLowerCase());

  const nameIdx = indexOf("name");
  if (nameIdx < 0) throw new Error('CSV is missing a "name" column.');

  const folderIdx = indexOf("folder");
  const locationIdx = indexOf("location");
  const quantityIdx = indexOf("quantity");
  const priceIdx = indexOf("price");
  const purchaseIdx = indexOf("purchasedate");
  const expirationIdx = indexOf("expirationdate");
  const tagsIdx = indexOf("tags");

  const folderNames = new Set<string>();
  const items: ToriItemPayload[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]!;
    if (row.every((cell) => !cell.trim())) continue;
    const name = row[nameIdx]?.trim();
    if (!name) throw new Error(`CSV row ${i + 1} is missing a name.`);
    const folderNameRaw = folderIdx >= 0 ? row[folderIdx]?.trim() || "" : "";
    const folderName =
      !folderNameRaw || folderNameRaw.toLowerCase() === "independent" ? null : folderNameRaw;
    if (folderName) folderNames.add(folderName);

    items.push({
      name,
      folderName,
      location: locationIdx >= 0 ? optionalString(row[locationIdx]) : null,
      quantity: parseQuantity(quantityIdx >= 0 ? row[quantityIdx] || "1" : "1"),
      price: priceIdx >= 0 ? optionalString(row[priceIdx]) : null,
      purchaseDate: purchaseIdx >= 0 ? optionalString(row[purchaseIdx]) : null,
      expirationDate: expirationIdx >= 0 ? optionalString(row[expirationIdx]) : null,
      tags: tagsIdx >= 0 ? parseTags(row[tagsIdx]) : [],
    });
  }

  if (items.length === 0) throw new Error("CSV has no item rows.");

  return {
    format: TORI_INVENTORY_FORMAT,
    version: TORI_INVENTORY_VERSION,
    exportedAt: new Date().toISOString(),
    householdName: null,
    folders: [...folderNames].map((name) => ({
      name,
      category: "Custom",
      creationDate: null,
    })),
    items,
  };
}

export async function readInventoryTransferFile(file: File): Promise<ToriInventoryFile> {
  const text = await file.text();
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".csv") || file.type === "text/csv") {
    return parseInventoryCsv(text);
  }
  if (
    lower.endsWith(".json") ||
    lower.endsWith(".tori.json") ||
    file.type === "application/json" ||
    text.trimStart().startsWith("{")
  ) {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error("Could not parse JSON file.");
    }
    return parseToriInventoryFile(raw);
  }
  throw new Error("Unsupported file type. Use a .tori.json / .json or .csv export.");
}

export interface InventoryImportHandlers {
  folders: Folder[];
  createFolder: (body: FolderInput) => Promise<Folder>;
  createItem: (body: ItemInput) => Promise<Item>;
}

export async function importInventoryPayload(
  payload: ToriInventoryFile,
  handlers: InventoryImportHandlers
): Promise<{ foldersCreated: number; itemsCreated: number }> {
  const folderIdByName = new Map(
    handlers.folders.map((folder) => [folder.name.toLowerCase(), folder.id])
  );
  let foldersCreated = 0;

  for (const folder of payload.folders) {
    const key = folder.name.toLowerCase();
    if (folderIdByName.has(key)) continue;
    const created = await handlers.createFolder({
      name: folder.name,
      category: folder.category || "Custom",
      creationDate: folder.creationDate ?? null,
    });
    folderIdByName.set(key, created.id);
    foldersCreated += 1;
  }

  // Ensure item-referenced folders exist even if omitted from folders[].
  for (const item of payload.items) {
    const name = item.folderName?.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (folderIdByName.has(key)) continue;
    const created = await handlers.createFolder({
      name,
      category: "Custom",
      creationDate: null,
    });
    folderIdByName.set(key, created.id);
    foldersCreated += 1;
  }

  let itemsCreated = 0;
  for (const item of payload.items) {
    const folderId = item.folderName
      ? folderIdByName.get(item.folderName.toLowerCase()) ?? null
      : null;
    await handlers.createItem({
      name: item.name,
      folderId,
      location: item.location ?? null,
      quantity: item.quantity,
      price: item.price ?? null,
      purchaseDate: item.purchaseDate ?? null,
      expirationDate: item.expirationDate ?? null,
      tags: item.tags ?? [],
    });
    itemsCreated += 1;
  }

  return { foldersCreated, itemsCreated };
}

export function downloadInventoryJson(
  folders: Folder[],
  items: Item[],
  householdName?: string | null
): void {
  const payload = inventoryToToriFile(folders, items, householdName);
  const base = slugifyFilename(householdName || "tori-inventory");
  downloadJsonFile(`${base}.tori.json`, payload);
}

export function downloadInventoryCsvFile(folders: Folder[], items: Item[], householdName?: string | null): void {
  const base = slugifyFilename(householdName || "tori-inventory");
  downloadTextFile(`${base}.csv`, inventoryToCsv(folders, items), "text/csv;charset=utf-8");
}

export function downloadInventoryPlainText(
  folders: Folder[],
  items: Item[],
  householdName?: string | null
): void {
  const base = slugifyFilename(householdName || "tori-inventory");
  downloadTextFile(`${base}.txt`, inventoryToPlainText(folders, items, householdName));
}

export async function downloadInventoryPdf(
  folders: Folder[],
  items: Item[],
  householdName?: string | null
): Promise<void> {
  const bytes = await createInventoryPdf({
    householdName: householdName || "Household",
    folders,
    items,
  });
  const base = slugifyFilename(householdName || "tori-inventory");
  downloadBlob(`${base}.pdf`, new Blob([bytes as BlobPart], { type: "application/pdf" }));
}
