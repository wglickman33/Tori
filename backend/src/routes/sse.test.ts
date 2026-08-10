import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();

describe("household SSE endpoint", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("requires a valid membership token", async () => {
    const ownerReg = await request(app).post("/api/auth/register").send({
      displayName: "SSE Owner",
      email: `sse-owner-${suffix}@example.com`,
      password: "password123",
    });
    expect(ownerReg.status).toBe(201);
    const outsiderReg = await request(app).post("/api/auth/register").send({
      displayName: "SSE Out",
      email: `sse-out-${suffix}@example.com`,
      password: "password123",
    });
    expect(outsiderReg.status).toBe(201);
    const householdRes = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${ownerReg.body.accessToken}`)
      .send({ name: "SSE House" });
    expect(householdRes.status).toBe(201);
    const householdId = householdRes.body.household.id as string;

    const noToken = await request(app).get(`/api/households/${householdId}/events`);
    expect(noToken.status).toBe(401);

    const outsider = await request(app)
      .get(`/api/households/${householdId}/events`)
      .query({ token: outsiderReg.body.accessToken });
    expect(outsider.status).toBe(403);
  });
});
