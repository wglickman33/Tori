import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import { executeToriTool, getExpiring, parseToriPendingAction, searchItems } from "./toriTools.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();
const today = new Date(2026, 7, 19);

describe("toriTools", () => {
  let userId = "";
  let householdId = "";
  let outsiderId = "";
  let accessToken = "";

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();

    const owner = await request(app).post("/api/auth/register").send({
      displayName: "Tools Owner",
      email: `tools-owner-${suffix}@example.com`,
      password: "password123",
    });
    accessToken = owner.body.accessToken as string;
    userId = owner.body.user.id as string;

    const house = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Tools House" });
    householdId = house.body.household.id as string;

    const folder = await request(app)
      .post(`/api/households/${householdId}/folders`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Dairy", category: "Food" });
    const folderId = folder.body.folder.id as string;

    await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Milk",
        location: "Fridge",
        folderId,
        tags: ["dairy"],
        quantity: 1,
        expirationDate: "2026-08-21",
      });
    await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Paper towels",
        location: "Pantry",
        tags: ["cleaning"],
        quantity: 2,
      });
    await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Yogurt",
        location: "Fridge",
        expirationDate: "2026-07-01",
        quantity: 1,
      });
    await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Water Bottle",
        location: "Pantry",
        quantity: 6,
        price: "12.99",
      });
    await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "iPhone Charger",
        location: "Desk",
        quantity: 1,
      });
    await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Computer Charger",
        location: "Desk",
        quantity: 1,
      });

    const outsider = await request(app).post("/api/auth/register").send({
      displayName: "Outsider",
      email: `tools-out-${suffix}@example.com`,
      password: "password123",
    });
    outsiderId = outsider.body.user.id as string;
  });

  it("search_items matches name, tags, location, and folder and scopes to the household", async () => {
    const byName = JSON.parse(await searchItems(userId, householdId, "milk"));
    expect(byName.count).toBe(1);
    expect(byName.items[0].name).toBe("Milk");
    expect(byName.items[0].folderName).toBe("Dairy");

    const byTag = JSON.parse(await searchItems(userId, householdId, "cleaning"));
    expect(byTag.count).toBe(1);
    expect(byTag.items[0].name).toBe("Paper towels");

    const byLocation = JSON.parse(await searchItems(userId, householdId, "fridge"));
    expect(byLocation.count).toBe(2);

    const byFolder = JSON.parse(await searchItems(userId, householdId, "dairy"));
    expect(byFolder.count).toBe(1);
    expect(byFolder.items[0].name).toBe("Milk");
  });

  it("search_items matches plurals and partial names", async () => {
    const plural = JSON.parse(await searchItems(userId, householdId, "water bottles"));
    expect(plural.count).toBeGreaterThanOrEqual(1);
    expect(plural.items.some((item: { name: string }) => item.name === "Water Bottle")).toBe(true);

    const singularToken = JSON.parse(await searchItems(userId, householdId, "bottles"));
    expect(singularToken.items.some((item: { name: string }) => item.name === "Water Bottle")).toBe(true);

    const chargers = JSON.parse(await searchItems(userId, householdId, "charger"));
    expect(chargers.count).toBe(2);
    expect(chargers.items.map((item: { name: string }) => item.name).sort()).toEqual([
      "Computer Charger",
      "iPhone Charger",
    ]);
  });

  it("search_items returns an empty list when nothing matches", async () => {
    const result = JSON.parse(await searchItems(userId, householdId, "saffron"));
    expect(result).toEqual({ query: "saffron", count: 0, items: [] });
  });

  it("search_items returns Forbidden when the user is not a member", async () => {
    const result = JSON.parse(await searchItems(outsiderId, householdId, "milk"));
    expect(result).toEqual({ error: "Forbidden" });
  });

  it("get_expiring lists overdue and soon items using the same day math as the app", async () => {
    const week = JSON.parse(await getExpiring(userId, householdId, 7, today));
    expect(week.withinDays).toBe(7);
    expect(week.items.map((item: { name: string }) => item.name)).toEqual(["Yogurt", "Milk"]);
    expect(week.items[0].daysUntil).toBeLessThan(0);
    expect(week.items[1].daysUntil).toBe(2);

    const todayOnly = JSON.parse(await getExpiring(userId, householdId, 0, today));
    expect(todayOnly.items.map((item: { name: string }) => item.name)).toEqual(["Yogurt"]);
  });

  it("executeToriTool dispatches search_items and get_expiring", async () => {
    const search = JSON.parse(
      await executeToriTool(userId, householdId, "search_items", '{"query":"paper"}')
    );
    expect(search.count).toBe(1);
    expect(search.items[0].name).toBe("Paper towels");

    const expiring = JSON.parse(
      await executeToriTool(userId, householdId, "get_expiring", '{"within_days":7}')
    );
    expect(expiring.count).toBeGreaterThan(0);

    const unknown = JSON.parse(await executeToriTool(userId, householdId, "nope", "{}"));
    expect(unknown.error).toMatch(/unknown tool/i);
  });

  it("lists locations, tags, folders, value, and a single item without inventing prices", async () => {
    const milk = JSON.parse(await searchItems(userId, householdId, "milk")).items[0];
    const one = JSON.parse(await executeToriTool(userId, householdId, "get_item", JSON.stringify({ item_id: milk.id })));
    expect(one.item.name).toBe("Milk");

    const locations = JSON.parse(await executeToriTool(userId, householdId, "list_locations", "{}"));
    expect(locations.locations.some((row: { location: string }) => row.location === "Fridge")).toBe(true);

    const inFridge = JSON.parse(
      await executeToriTool(userId, householdId, "items_in_location", '{"location":"Fridge"}')
    );
    expect(inFridge.count).toBe(2);

    const tags = JSON.parse(await executeToriTool(userId, householdId, "list_tags", "{}"));
    expect(tags.tags.some((row: { tag: string }) => row.tag === "dairy")).toBe(true);

    const tagged = JSON.parse(await executeToriTool(userId, householdId, "items_with_tag", '{"tag":"dairy"}'));
    expect(tagged.items[0].name).toBe("Milk");

    const folders = JSON.parse(await executeToriTool(userId, householdId, "list_folders", "{}"));
    expect(folders.folders[0].name).toBe("Dairy");

    const value = JSON.parse(await executeToriTool(userId, householdId, "get_inventory_value", "{}"));
    expect(value.itemCount).toBe(6);
    expect(value.pricedCount).toBe(0);
    expect(value.totalValue).toBe(0);
  });

  it("proposes writes without persisting them", async () => {
    const before = JSON.parse(await searchItems(userId, householdId, "")).count;
    const proposed = JSON.parse(
      await executeToriTool(
        userId,
        householdId,
        "propose_add_item",
        '{"name":"Oats","location":"Pantry","quantity":1}'
      )
    );
    expect(proposed.needsConfirmation).toBe(true);
    expect(proposed.item.name).toBe("Oats");
    const after = JSON.parse(await searchItems(userId, householdId, "")).count;
    expect(after).toBe(before);

    const milk = JSON.parse(await searchItems(userId, householdId, "milk")).items[0];
    const update = JSON.parse(
      await executeToriTool(
        userId,
        householdId,
        "propose_update_item",
        JSON.stringify({ item_id: milk.id, quantity: 3 })
      )
    );
    expect(update.type).toBe("update_item");
    expect(update.patch.quantity).toBe(3);

    const remove = JSON.parse(
      await executeToriTool(userId, householdId, "propose_delete_item", JSON.stringify({ item_id: milk.id }))
    );
    expect(remove.type).toBe("delete_item");
    expect(remove.itemName).toBe("Milk");

    expect(parseToriPendingAction("propose_add_item", JSON.stringify(proposed))).toEqual({
      type: "add_item",
      item: proposed.item,
    });
    expect(parseToriPendingAction("search_items", JSON.stringify(proposed))).toBeUndefined();
  });
});
