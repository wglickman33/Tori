import { create } from "zustand";
import {
  inventoryApi,
  type Folder,
  type FolderInput,
  type Item,
  type ItemInput,
} from "../api/client";

export type HouseholdStreamEvent =
  | { type: "folder.created"; folder: Folder; actorUserId: string }
  | { type: "folder.updated"; folder: Folder; actorUserId: string }
  | { type: "folder.deleted"; folderId: string; actorUserId: string }
  | { type: "item.created"; item: Item; actorUserId: string }
  | { type: "item.updated"; item: Item; actorUserId: string }
  | { type: "item.deleted"; itemId: string; actorUserId: string }
  | { type: "membership.revoked"; actorUserId: string };

interface InventoryState {
  householdId: string | null;
  folders: Folder[];
  items: Item[];
  openFolderIds: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;
  load: (householdId: string) => Promise<void>;
  createFolder: (body: FolderInput) => Promise<Folder>;
  updateFolder: (folderId: string, body: Partial<FolderInput>) => Promise<Folder>;
  deleteFolder: (folderId: string) => Promise<void>;
  createItem: (body: ItemInput) => Promise<Item>;
  updateItem: (itemId: string, body: Partial<ItemInput>) => Promise<Item>;
  deleteItem: (itemId: string) => Promise<void>;
  uploadItemImage: (itemId: string, file: File) => Promise<Item>;
  deleteItemImage: (itemId: string) => Promise<Item>;
  toggleFolder: (folderId: string) => void;
  applyEvent: (event: HouseholdStreamEvent) => void;
  clear: () => void;
}

function upsertById<T extends { id: string }>(list: T[], row: T): T[] {
  const idx = list.findIndex((x) => x.id === row.id);
  if (idx === -1) return [...list, row].sort((a, b) => a.id.localeCompare(b.id));
  const next = [...list];
  next[idx] = row;
  return next;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  householdId: null,
  folders: [],
  items: [],
  openFolderIds: {},
  isLoading: false,
  error: null,

  load: async (householdId) => {
    set({ isLoading: true, error: null, householdId });
    try {
      const [foldersRes, itemsRes] = await Promise.all([
        inventoryApi.listFolders(householdId),
        inventoryApi.listItems(householdId),
      ]);
      set({
        folders: foldersRes.folders,
        items: itemsRes.items,
        isLoading: false,
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load inventory",
      });
    }
  },

  createFolder: async (body) => {
    const householdId = get().householdId;
    if (!householdId) throw new Error("No household");
    const { folder } = await inventoryApi.createFolder(householdId, body);
    set((s) => ({ folders: upsertById(s.folders, folder) }));
    return folder;
  },

  updateFolder: async (folderId, body) => {
    const householdId = get().householdId;
    if (!householdId) throw new Error("No household");
    const { folder } = await inventoryApi.updateFolder(householdId, folderId, body);
    set((s) => ({ folders: upsertById(s.folders, folder) }));
    return folder;
  },

  deleteFolder: async (folderId) => {
    const householdId = get().householdId;
    if (!householdId) throw new Error("No household");
    await inventoryApi.deleteFolder(householdId, folderId);
    set((s) => ({
      folders: s.folders.filter((f) => f.id !== folderId),
      items: s.items.filter((i) => i.folderId !== folderId),
    }));
  },

  createItem: async (body) => {
    const householdId = get().householdId;
    if (!householdId) throw new Error("No household");
    const { item } = await inventoryApi.createItem(householdId, body);
    set((s) => ({
      items: upsertById(s.items, item),
      openFolderIds: item.folderId
        ? { ...s.openFolderIds, [item.folderId]: true }
        : s.openFolderIds,
    }));
    return item;
  },

  updateItem: async (itemId, body) => {
    const householdId = get().householdId;
    if (!householdId) throw new Error("No household");
    const { item } = await inventoryApi.updateItem(householdId, itemId, body);
    set((s) => ({
      items: upsertById(s.items, item),
      openFolderIds: item.folderId
        ? { ...s.openFolderIds, [item.folderId]: true }
        : s.openFolderIds,
    }));
    return item;
  },

  deleteItem: async (itemId) => {
    const householdId = get().householdId;
    if (!householdId) throw new Error("No household");
    await inventoryApi.deleteItem(householdId, itemId);
    set((s) => ({ items: s.items.filter((i) => i.id !== itemId) }));
  },

  uploadItemImage: async (itemId, file) => {
    const householdId = get().householdId;
    if (!householdId) throw new Error("No household");
    const { item } = await inventoryApi.uploadItemImage(householdId, itemId, file);
    set((s) => ({ items: upsertById(s.items, item) }));
    return item;
  },

  deleteItemImage: async (itemId) => {
    const householdId = get().householdId;
    if (!householdId) throw new Error("No household");
    const { item } = await inventoryApi.deleteItemImage(householdId, itemId);
    set((s) => ({ items: upsertById(s.items, item) }));
    return item;
  },

  toggleFolder: (folderId) => {
    set((s) => ({
      openFolderIds: { ...s.openFolderIds, [folderId]: !s.openFolderIds[folderId] },
    }));
  },

  applyEvent: (event) => {
    switch (event.type) {
      case "folder.created":
      case "folder.updated":
        set((s) => ({ folders: upsertById(s.folders, event.folder) }));
        break;
      case "folder.deleted":
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== event.folderId),
          items: s.items.filter((i) => i.folderId !== event.folderId),
        }));
        break;
      case "item.created":
      case "item.updated":
        set((s) => ({ items: upsertById(s.items, event.item) }));
        break;
      case "item.deleted":
        set((s) => ({ items: s.items.filter((i) => i.id !== event.itemId) }));
        break;
      default:
        break;
    }
  },

  clear: () =>
    set({
      householdId: null,
      folders: [],
      items: [],
      openFolderIds: {},
      isLoading: false,
      error: null,
    }),
}));
