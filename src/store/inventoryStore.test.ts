import { beforeEach, describe, expect, it } from "vitest";
import { useInventoryStore } from "./inventoryStore";

describe("inventoryStore.applyEvent", () => {
  beforeEach(() => {
    useInventoryStore.setState({
      householdId: "h1",
      folders: [],
      items: [],
      openFolderIds: {},
      isLoading: false,
      error: null,
    });
  });

  it("applies remote folder and item events", () => {
    useInventoryStore.getState().applyEvent({
      type: "folder.created",
      actorUserId: "u2",
      folder: {
        id: "f1",
        householdId: "h1",
        name: "Garage",
        category: "Tools",
        creationDate: null,
      },
    });
    useInventoryStore.getState().applyEvent({
      type: "item.created",
      actorUserId: "u2",
      item: {
        id: "i1",
        householdId: "h1",
        folderId: "f1",
        name: "Drill",
        location: "Shelf",
        purchaseDate: null,
        expirationDate: null,
        quantity: 1,
        price: null,
        tags: ["tools"],
        imageUrl: null,
      },
    });
    expect(useInventoryStore.getState().folders).toHaveLength(1);
    expect(useInventoryStore.getState().items[0]?.name).toBe("Drill");

    useInventoryStore.getState().applyEvent({
      type: "folder.deleted",
      actorUserId: "u2",
      folderId: "f1",
    });
    expect(useInventoryStore.getState().folders).toHaveLength(0);
    expect(useInventoryStore.getState().items).toHaveLength(0);
  });
});
