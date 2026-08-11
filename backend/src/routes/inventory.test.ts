import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();

async function register(email: string) {
  const res = await request(app).post("/api/auth/register").send({
    displayName: "Tester",
    email,
    password: "password123",
  });
  return res.body as { accessToken: string; user: { id: string } };
}

describe("inventory CRUD + membership", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("supports folders, independent items, tags, cascade delete", async () => {
    const owner = await register(`inv-owner-${suffix}@example.com`);
    const outsider = await register(`inv-out-${suffix}@example.com`);

    const householdRes = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Inventory House" });
    expect(householdRes.status).toBe(201);
    const householdId = householdRes.body.household.id as string;

    const forbidden = await request(app)
      .get(`/api/households/${householdId}/folders`)
      .set("Authorization", `Bearer ${outsider.accessToken}`);
    expect(forbidden.status).toBe(403);

    const folderRes = await request(app)
      .post(`/api/households/${householdId}/folders`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Pantry", category: "Unrefrigerated Food" });
    expect(folderRes.status).toBe(201);
    const folderId = folderRes.body.folder.id as string;

    const itemInFolder = await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        name: "Rice",
        folderId,
        quantity: 2,
        tags: ["grain", "staple"],
        price: 4.5,
      });
    expect(itemInFolder.status).toBe(201);
    expect(itemInFolder.body.item.tags).toEqual(["grain", "staple"]);

    const independent = await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Ladder", folderId: null, quantity: 1, tags: ["garage"] });
    expect(independent.status).toBe(201);
    expect(independent.body.item.folderId).toBeNull();

    const listed = await request(app)
      .get(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${owner.accessToken}`);
    expect(listed.body.items).toHaveLength(2);

    await request(app)
      .delete(`/api/households/${householdId}/folders/${folderId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    const afterDelete = await request(app)
      .get(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${owner.accessToken}`);
    expect(afterDelete.body.items).toHaveLength(1);
    expect(afterDelete.body.items[0].name).toBe("Ladder");
  });

  it("updates folders and items, and deletes items", async () => {
    const owner = await register(`inv-patch-${suffix}@example.com`);

    const householdRes = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Patch House" });
    expect(householdRes.status).toBe(201);
    const householdId = householdRes.body.household.id as string;

    const folderRes = await request(app)
      .post(`/api/households/${householdId}/folders`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Pantry", category: "Unrefrigerated Food" });
    expect(folderRes.status).toBe(201);
    const folderId = folderRes.body.folder.id as string;

    const renamedFolder = await request(app)
      .patch(`/api/households/${householdId}/folders/${folderId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Dry Goods" });
    expect(renamedFolder.status).toBe(200);
    expect(renamedFolder.body.folder.name).toBe("Dry Goods");

    const itemRes = await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({
        name: "Beans",
        folderId,
        quantity: 1,
        price: 2,
        tags: ["pantry"],
      });
    expect(itemRes.status).toBe(201);
    const itemId = itemRes.body.item.id as string;

    const patchedItem = await request(app)
      .patch(`/api/households/${householdId}/items/${itemId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Black Beans", quantity: 3, price: 2.5, folderId: null });
    expect(patchedItem.status).toBe(200);
    expect(patchedItem.body.item.name).toBe("Black Beans");
    expect(patchedItem.body.item.quantity).toBe(3);
    expect(patchedItem.body.item.price).toBe("2.50");
    expect(patchedItem.body.item.folderId).toBeNull();

    await request(app)
      .delete(`/api/households/${householdId}/items/${itemId}`)
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .expect(204);

    const listed = await request(app)
      .get(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${owner.accessToken}`);
    expect(listed.body.items).toHaveLength(0);
  });
});
