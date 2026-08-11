import { describe, expect, it } from "vitest";
import type { Folder, Item } from "../api/client";
import { INDEPENDENT_FOLDER_KEY } from "./inventoryFilters";
import {
  NO_LOCATION_KEY,
  applyInventoryFacets,
  emptyInventorySearchFilters,
  runInventorySearch,
} from "./inventorySearchQuery";

const folders: Folder[] = [
  {
    id: "f1",
    householdId: "h1",
    name: "Tech",
    category: "Electronics",
    creationDate: null,
  },
  {
    id: "food",
    householdId: "h1",
    name: "Fridge",
    category: "Refrigerated Food",
    creationDate: null,
  },
];

const item = (overrides: Partial<Item>): Item => ({
  id: "i1",
  householdId: "h1",
  folderId: "f1",
  name: "Widget",
  location: "Desk",
  purchaseDate: null,
  expirationDate: null,
  quantity: 1,
  price: "10",
  tags: ["gear"],
  imageUrl: null,
  ...overrides,
});

describe("inventorySearchQuery", () => {
  it("filters by folder, tag, location, photo, and price", () => {
    const items = [
      item({ id: "1", folderId: "f1", tags: ["gear"], location: "Desk", price: "10" }),
      item({
        id: "2",
        folderId: null,
        name: "Loose",
        tags: ["misc"],
        location: null,
        price: null,
        imageUrl: "/a.png",
      }),
      item({ id: "3", folderId: "f1", name: "Cable", tags: ["gear"], price: "25", location: "Desk" }),
    ];

    const base = emptyInventorySearchFilters();
    expect(
      applyInventoryFacets(items, folders, {
        ...base,
        folderIds: [INDEPENDENT_FOLDER_KEY],
      }).map((i) => i.id)
    ).toEqual(["2"]);

    expect(
      applyInventoryFacets(items, folders, { ...base, tags: ["gear"], minPrice: 15 }).map((i) => i.id)
    ).toEqual(["3"]);

    expect(
      applyInventoryFacets(items, folders, { ...base, locations: [NO_LOCATION_KEY] }).map((i) => i.id)
    ).toEqual(["2"]);

    expect(
      applyInventoryFacets(items, folders, { ...base, hasPhoto: "yes" }).map((i) => i.id)
    ).toEqual(["2"]);
  });

  it("filters expiration states relative to threshold", () => {
    const today = new Date(2026, 7, 10);
    const items = [
      item({ id: "over", name: "Old milk", folderId: "food", expirationDate: "2026-08-01" }),
      item({ id: "soon", name: "Yogurt", folderId: "food", expirationDate: "2026-08-12" }),
      item({ id: "later", name: "Hub", expirationDate: "2026-12-01" }),
      item({ id: "none", name: "Charger", expirationDate: null }),
    ];

    expect(
      applyInventoryFacets(items, folders, { ...emptyInventorySearchFilters(), expiration: "overdue" }, today, 7).map(
        (i) => i.id
      )
    ).toEqual(["over"]);

    expect(
      applyInventoryFacets(items, folders, { ...emptyInventorySearchFilters(), expiration: "expiring" }, today, 7).map(
        (i) => i.id
      )
    ).toEqual(["over", "soon"]);

    expect(
      applyInventoryFacets(items, folders, { ...emptyInventorySearchFilters(), expiration: "missing" }, today, 7).map(
        (i) => i.id
      )
    ).toEqual(["none"]);
  });

  it("runs text search then facets", () => {
    const items = [
      item({ id: "1", name: "iPhone Charger", tags: ["Charger"] }),
      item({ id: "2", name: "Anker Hub", tags: ["Dock"], price: "40" }),
    ];
    const results = runInventorySearch(
      folders,
      items,
      { ...emptyInventorySearchFilters(), query: "charger", minPrice: 1 },
      "relevance"
    );
    expect(results.map((i) => i.id)).toEqual(["1"]);
  });
});
