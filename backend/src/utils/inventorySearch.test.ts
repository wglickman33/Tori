import { describe, expect, it } from "vitest";
import {
  buildInventorySearchIndex,
  searchInventoryDocIds,
  searchQueryVariants,
} from "./inventorySearch.js";

describe("inventorySearch", () => {
  const docs = [
    {
      id: "1",
      name: "Water Bottle",
      tags: "kitchen",
      folderName: "",
      category: "",
      location: "Pantry",
      price: "12.99",
    },
    {
      id: "2",
      name: "iPhone Charger",
      tags: "",
      folderName: "Tech",
      category: "Electronics",
      location: "Desk",
      price: "",
    },
  ];

  it("builds plural query variants", () => {
    expect(searchQueryVariants("water bottles")).toEqual(
      expect.arrayContaining(["water bottles", "water bottle"])
    );
    expect(searchQueryVariants("cargadores")).toEqual(
      expect.arrayContaining(["cargadores", "cargador"])
    );
  });

  it("finds singular items from plural queries", () => {
    const index = buildInventorySearchIndex(docs);
    const ids = searchInventoryDocIds(index, "water bottles");
    expect(ids).toEqual(["1"]);
  });

  it("ranks partial name matches", () => {
    const index = buildInventorySearchIndex([
      ...docs,
      {
        id: "3",
        name: "Computer Charger",
        tags: "",
        folderName: "Tech",
        category: "Electronics",
        location: "Desk",
        price: "",
      },
    ]);
    const ids = searchInventoryDocIds(index, "charger");
    expect(ids).toHaveLength(2);
    expect(ids).toEqual(expect.arrayContaining(["2", "3"]));
  });

  it("finds English items from Spanish queries", () => {
    const index = buildInventorySearchIndex(docs);
    expect(searchInventoryDocIds(index, "botella de agua")).toEqual(["1"]);
    expect(searchInventoryDocIds(index, "cargador")).toEqual(expect.arrayContaining(["2"]));
  });

  it("matches chargers but not unrelated items when searching cargadores", () => {
    const index = buildInventorySearchIndex([
      {
        id: "hub",
        name: "Anker Hub",
        tags: "",
        folderName: "Tech Stuff",
        category: "",
        location: "Desk",
        price: "",
      },
      {
        id: "charger",
        name: "iPhone Charger",
        tags: "",
        folderName: "Tech Stuff",
        category: "",
        location: "Desk",
        price: "",
      },
    ]);
    expect(searchInventoryDocIds(index, "cargadores")).toEqual(["charger"]);
  });
});
