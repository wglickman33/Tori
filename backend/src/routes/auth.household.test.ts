import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();

describe("auth + household acceptance", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("registers, creates household, joins second user, rejects bad cases", async () => {
    const ownerEmail = `owner-${suffix}@example.com`;
    const memberEmail = `member-${suffix}@example.com`;

    const ownerReg = await request(app).post("/api/auth/register").send({
      displayName: "Owner",
      email: ownerEmail,
      password: "password123",
    });
    expect(ownerReg.status).toBe(201);
    const ownerToken = ownerReg.body.accessToken as string;

    const dup = await request(app).post("/api/auth/register").send({
      displayName: "Owner",
      email: ownerEmail,
      password: "password123",
    });
    expect(dup.status).toBe(400);

    const created = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Test House" });
    expect(created.status).toBe(201);
    const inviteCode = created.body.household.inviteCode as string;
    const householdId = created.body.household.id as string;

    const memberReg = await request(app).post("/api/auth/register").send({
      displayName: "Member",
      email: memberEmail,
      password: "password123",
    });
    expect(memberReg.status).toBe(201);
    const memberToken = memberReg.body.accessToken as string;

    const badCode = await request(app)
      .post("/api/households/join")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ inviteCode: "NOPECODE" });
    expect(badCode.status).toBe(404);

    const joined = await request(app)
      .post("/api/households/join")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ inviteCode });
    expect(joined.status).toBe(201);
    expect(joined.body.household.id).toBe(householdId);

    const twice = await request(app)
      .post("/api/households/join")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ inviteCode });
    expect(twice.status).toBe(400);

    const ownerMine = await request(app)
      .get("/api/households/mine")
      .set("Authorization", `Bearer ${ownerToken}`);
    const memberMine = await request(app)
      .get("/api/households/mine")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(ownerMine.body.household.id).toBe(memberMine.body.household.id);
    expect(ownerMine.body.household.memberCount).toBe(2);

    const refresh = await request(app).post("/api/auth/refresh").send({
      refreshToken: ownerReg.body.refreshToken,
    });
    expect(refresh.status).toBe(200);
    expect(refresh.body.accessToken).toBeTruthy();

    const tampered = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.bad");
    expect(tampered.status).toBe(401);
  });
});
