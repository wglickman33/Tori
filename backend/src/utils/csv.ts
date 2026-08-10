import type { Folder } from "../models/Folder.js";
import type { Item } from "../models/Item.js";

export function csvEscape(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildInventoryCsv(folders: Folder[], items: Item[]): string {
  const folderName = (folderId: string | null) => {
    if (!folderId) return "Independent";
    return folders.find((f) => f.id === folderId)?.name ?? "";
  };

  const header = [
    "name",
    "folder",
    "location",
    "quantity",
    "price",
    "purchaseDate",
    "expirationDate",
    "tags",
    "imageUrl",
  ];

  const rows = items.map((item) =>
    [
      csvEscape(item.name),
      csvEscape(folderName(item.folderId)),
      csvEscape(item.location),
      csvEscape(item.quantity),
      csvEscape(item.price),
      csvEscape(item.purchaseDate),
      csvEscape(item.expirationDate),
      csvEscape((item.tags ?? []).join("; ")),
      csvEscape(item.imageUrl),
    ].join(",")
  );

  return [header.join(","), ...rows].join("\n") + "\n";
}
