import type { Folder } from "../models/Folder.js";
import type { Item } from "../models/Item.js";

export type SerializedFolder = {
  id: string;
  householdId: string;
  name: string;
  category: string;
  creationDate: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SerializedItem = {
  id: string;
  householdId: string;
  folderId: string | null;
  name: string;
  location: string | null;
  purchaseDate: string | null;
  expirationDate: string | null;
  quantity: number;
  price: string | null;
  tags: string[];
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeFolder(folder: Folder): SerializedFolder {
  return {
    id: folder.id,
    householdId: folder.householdId,
    name: folder.name,
    category: folder.category,
    creationDate: folder.creationDate,
    createdAt: folder.createdAt,
    updatedAt: folder.updatedAt,
  };
}

export function serializeItem(item: Item): SerializedItem {
  return {
    id: item.id,
    householdId: item.householdId,
    folderId: item.folderId,
    name: item.name,
    location: item.location,
    purchaseDate: item.purchaseDate,
    expirationDate: item.expirationDate,
    quantity: item.quantity,
    price: item.price === null || item.price === undefined ? null : String(item.price),
    tags: item.tags ?? [],
    imageUrl: item.imageUrl,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}
