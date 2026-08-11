import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Folder, Item } from "../api/client";
import { useInventoryStore } from "./inventoryStore";

const folder = (overrides: Partial<Folder> = {}): Folder => ({
  id: "f1",
  householdId: "h1",
  name: "Pantry",
  category: "Food",
  creationDate: null,
  ...overrides,
});

const item = (overrides: Partial<Item> = {}): Item => ({
  id: "i1",
  householdId: "h1",
  folderId: "f1",
  name: "Rice",
  location: null,
  purchaseDate: null,
  expirationDate: null,
  quantity: 1,
  price: null,
  tags: [],
  imageUrl: null,
  ...overrides,
});

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    inventoryApi: {
      listFolders: vi.fn(),
      listItems: vi.fn(),
      createFolder: vi.fn(),
      updateFolder: vi.fn(),
      deleteFolder: vi.fn(),
      createItem: vi.fn(),
      updateItem: vi.fn(),
      deleteItem: vi.fn(),
      uploadItemImage: vi.fn(),
      deleteItemImage: vi.fn(),
    },
  };
});

describe("inventoryStore", () => {
  beforeEach(() => {
    useInventoryStore.setState({
      householdId: "h1",
      folders: [],
      items: [],
      openFolderIds: {},
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it("applies remote folder and item events including updates and deletes", () => {
    useInventoryStore.getState().applyEvent({
      type: "folder.created",
      actorUserId: "u2",
      folder: folder(),
    });
    useInventoryStore.getState().applyEvent({
      type: "item.created",
      actorUserId: "u2",
      item: item(),
    });
    useInventoryStore.getState().applyEvent({
      type: "item.updated",
      actorUserId: "u2",
      item: item({ name: "Brown Rice", quantity: 2 }),
    });
    expect(useInventoryStore.getState().items[0]?.name).toBe("Brown Rice");

    useInventoryStore.getState().applyEvent({
      type: "item.deleted",
      actorUserId: "u2",
      itemId: "i1",
    });
    expect(useInventoryStore.getState().items).toHaveLength(0);

    useInventoryStore.getState().applyEvent({
      type: "folder.deleted",
      actorUserId: "u2",
      folderId: "f1",
    });
    expect(useInventoryStore.getState().folders).toHaveLength(0);
  });

  it("loads inventory and supports create/update/delete item", async () => {
    const { inventoryApi } = await import("../api/client");
    vi.mocked(inventoryApi.listFolders).mockResolvedValue({ folders: [folder()] });
    vi.mocked(inventoryApi.listItems).mockResolvedValue({ items: [item()] });

    await useInventoryStore.getState().load("h1");
    expect(useInventoryStore.getState().folders).toHaveLength(1);
    expect(useInventoryStore.getState().items).toHaveLength(1);

    const created = item({ id: "i2", name: "Beans" });
    vi.mocked(inventoryApi.createItem).mockResolvedValue({ item: created });
    await useInventoryStore.getState().createItem({
      name: "Beans",
      folderId: "f1",
      quantity: 1,
    });
    expect(useInventoryStore.getState().items.some((row) => row.id === "i2")).toBe(true);

    const updated = item({ id: "i2", name: "Black Beans", quantity: 3 });
    vi.mocked(inventoryApi.updateItem).mockResolvedValue({ item: updated });
    await useInventoryStore.getState().updateItem("i2", { name: "Black Beans", quantity: 3 });
    expect(useInventoryStore.getState().items.find((row) => row.id === "i2")?.name).toBe(
      "Black Beans"
    );

    vi.mocked(inventoryApi.deleteItem).mockResolvedValue(undefined);
    await useInventoryStore.getState().deleteItem("i2");
    expect(useInventoryStore.getState().items.some((row) => row.id === "i2")).toBe(false);
  });
});
