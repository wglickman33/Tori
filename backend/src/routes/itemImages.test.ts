import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import { MAX_IMAGE_BYTES } from "../utils/imageStorage.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();

// Minimal valid 1x1 PNG
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

describe("item image upload", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("uploads, replaces path, rejects oversized files", async () => {
    const owner = await request(app).post("/api/auth/register").send({
      displayName: "Imager",
      email: `image-${suffix}@example.com`,
      password: "password123",
    });
    const token = owner.body.accessToken as string;
    const household = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Image House" });
    const householdId = household.body.household.id as string;

    const itemRes = await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Camera", quantity: 1 });
    const itemId = itemRes.body.item.id as string;

    const uploaded = await request(app)
      .post(`/api/households/${householdId}/items/${itemId}/image`)
      .set("Authorization", `Bearer ${token}`)
      .attach("image", PNG, { filename: "dot.png", contentType: "image/png" });

    expect(uploaded.status).toBe(200);
    expect(uploaded.body.item.imageUrl).toMatch(/^\/uploads\//);

    const oversized = await request(app)
      .post(`/api/households/${householdId}/items/${itemId}/image`)
      .set("Authorization", `Bearer ${token}`)
      .attach("image", Buffer.alloc(MAX_IMAGE_BYTES + 1), {
        filename: "big.png",
        contentType: "image/png",
      });
    expect(oversized.status).toBe(400);
    expect(oversized.body.error).toMatch(/5MB/i);

    const removed = await request(app)
      .delete(`/api/households/${householdId}/items/${itemId}/image`)
      .set("Authorization", `Bearer ${token}`);
    expect(removed.status).toBe(200);
    expect(removed.body.item.imageUrl).toBeNull();
  });
});
