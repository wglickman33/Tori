import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();

describe("settings + household management", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("updates profile, lists/removes members, blocks owner delete with members", async () => {
    const ownerReg = await request(app).post("/api/auth/register").send({
      displayName: "Owner",
      email: `set-owner-${suffix}@example.com`,
      password: "password123",
    });
    const ownerToken = ownerReg.body.accessToken as string;

    const house = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Settings House" });
    const householdId = house.body.household.id as string;
    const inviteCode = house.body.household.inviteCode as string;

    const patched = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ displayName: "Owner Updated" });
    expect(patched.status).toBe(200);
    expect(patched.body.displayName).toBe("Owner Updated");

    const themePatched = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ theme: "dark" });
    expect(themePatched.status).toBe(200);
    expect(themePatched.body.theme).toBe("dark");

    const languagePatched = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ language: "es" });
    expect(languagePatched.status).toBe(200);
    expect(languagePatched.body.language).toBe("es");

    const passwordMissingCurrent = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ newPassword: "password456" });
    expect(passwordMissingCurrent.status).toBe(400);

    const passwordChanged = await request(app)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ currentPassword: "password123", newPassword: "password456" });
    expect(passwordChanged.status).toBe(200);

    const renamed = await request(app)
      .patch(`/api/households/${householdId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Renamed House" });
    expect(renamed.status).toBe(200);
    expect(renamed.body.household.name).toBe("Renamed House");
    expect(Array.isArray(renamed.body.household.locationPresets)).toBe(true);
    expect(renamed.body.household.locationPresets.length).toBeGreaterThan(0);

    const presetsUpdated = await request(app)
      .put(`/api/households/${householdId}/location-presets`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ locationPresets: ["Pantry", "Garage", "Pantry", "Custom"] });
    expect(presetsUpdated.status).toBe(200);
    expect(presetsUpdated.body.household.locationPresets).toEqual(["Pantry", "Garage"]);

    const memberReg = await request(app).post("/api/auth/register").send({
      displayName: "Member",
      email: `set-member-${suffix}@example.com`,
      password: "password123",
    });
    const memberToken = memberReg.body.accessToken as string;
    const memberId = memberReg.body.user.id as string;

    await request(app)
      .post("/api/households/join")
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ inviteCode })
      .expect(201);

    const members = await request(app)
      .get(`/api/households/${householdId}/members`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(members.status).toBe(200);
    expect(members.body.members).toHaveLength(2);

    const ownerDeleteBlocked = await request(app)
      .delete("/api/auth/me")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(ownerDeleteBlocked.status).toBe(400);

    await request(app)
      .delete(`/api/households/${householdId}/members/${memberId}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .expect(204);

    const memberMine = await request(app)
      .get("/api/households/mine")
      .set("Authorization", `Bearer ${memberToken}`);
    expect(memberMine.body.household).toBeNull();

    const ownerDelete = await request(app)
      .delete("/api/auth/me")
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(ownerDelete.status).toBe(204);
  });
});
