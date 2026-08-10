import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();

describe("CSV export", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("exports inventory with escaped special characters", async () => {
    const owner = await request(app).post("/api/auth/register").send({
      displayName: "Exporter",
      email: `export-${suffix}@example.com`,
      password: "password123",
    });
    const token = owner.body.accessToken as string;
    const household = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Export House" });
    const householdId = household.body.household.id as string;

    await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: 'Sauce, "Hot"',
        quantity: 1,
        tags: ["spicy", "pantry,2"],
      })
      .expect(201);

    const res = await request(app)
      .get(`/api/households/${householdId}/export`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.text).toContain('"Sauce, ""Hot"""');
    expect(res.text).toContain('"spicy; pantry,2"');
  });
});
