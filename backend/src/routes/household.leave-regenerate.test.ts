import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();

async function register(email: string, displayName: string) {
  const res = await request(app).post("/api/auth/register").send({
    displayName,
    email,
    password: "password123",
  });
  expect(res.status).toBe(201);
  return res.body as { accessToken: string; user: { id: string } };
}

describe("household leave + regenerate invite code", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("regenerates invite code for owners only", async () => {
    const owner = await register(`regen-owner-${suffix}@example.com`, "Owner");
    const member = await register(`regen-member-${suffix}@example.com`, "Member");

    const house = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Regen House" });
    expect(house.status).toBe(201);
    const householdId = house.body.household.id as string;
    const oldCode = house.body.household.inviteCode as string;

    await request(app)
      .post("/api/households/join")
      .set("Authorization", `Bearer ${member.accessToken}`)
      .send({ inviteCode: oldCode })
      .expect(201);

    const memberDenied = await request(app)
      .post(`/api/households/${householdId}/regenerate-code`)
      .set("Authorization", `Bearer ${member.accessToken}`);
    expect(memberDenied.status).toBe(403);

    const regenerated = await request(app)
      .post(`/api/households/${householdId}/regenerate-code`)
      .set("Authorization", `Bearer ${owner.accessToken}`);
    expect(regenerated.status).toBe(200);
    expect(regenerated.body.inviteCode).toBeTruthy();
    expect(regenerated.body.inviteCode).not.toBe(oldCode);
  });

  it("lets members leave; blocks owner leave while others remain; dissolves sole-owner household", async () => {
    const owner = await register(`leave-owner-${suffix}@example.com`, "Owner");
    const member = await register(`leave-member-${suffix}@example.com`, "Member");

    const house = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${owner.accessToken}`)
      .send({ name: "Leave House" });
    expect(house.status).toBe(201);
    const householdId = house.body.household.id as string;
    const inviteCode = house.body.household.inviteCode as string;

    await request(app)
      .post("/api/households/join")
      .set("Authorization", `Bearer ${member.accessToken}`)
      .send({ inviteCode })
      .expect(201);

    const ownerBlocked = await request(app)
      .post(`/api/households/${householdId}/leave`)
      .set("Authorization", `Bearer ${owner.accessToken}`);
    expect(ownerBlocked.status).toBe(400);

    const memberLeave = await request(app)
      .post(`/api/households/${householdId}/leave`)
      .set("Authorization", `Bearer ${member.accessToken}`);
    expect(memberLeave.status).toBe(204);

    const memberMine = await request(app)
      .get("/api/households/mine")
      .set("Authorization", `Bearer ${member.accessToken}`);
    expect(memberMine.body.household).toBeNull();

    const soleOwnerLeave = await request(app)
      .post(`/api/households/${householdId}/leave`)
      .set("Authorization", `Bearer ${owner.accessToken}`);
    expect(soleOwnerLeave.status).toBe(204);

    const ownerMine = await request(app)
      .get("/api/households/mine")
      .set("Authorization", `Bearer ${owner.accessToken}`);
    expect(ownerMine.body.household).toBeNull();
  });
});
