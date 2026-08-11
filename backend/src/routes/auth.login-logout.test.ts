import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import "dotenv/config";
import { createApp } from "../app.js";
import { sequelize } from "../db/sequelize.js";
import "../models/index.js";

const app = createApp();
const suffix = Date.now();

describe("auth login + logout", () => {
  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();
  });

  it("logs in with valid credentials and rejects bad password", async () => {
    const email = `login-${suffix}@example.com`;
    const password = "password123";

    const registered = await request(app).post("/api/auth/register").send({
      displayName: "Login User",
      email,
      password,
    });
    expect(registered.status).toBe(201);

    const bad = await request(app).post("/api/auth/login").send({
      email,
      password: "wrong-password",
    });
    expect(bad.status).toBe(401);

    const ok = await request(app).post("/api/auth/login").send({ email, password });
    expect(ok.status).toBe(200);
    expect(ok.body.accessToken).toBeTruthy();
    expect(ok.body.refreshToken).toBeTruthy();
    expect(ok.body.user.email).toBe(email);

    const me = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${ok.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(email);
  });

  it("logout revokes refresh token", async () => {
    const email = `logout-${suffix}@example.com`;
    const registered = await request(app).post("/api/auth/register").send({
      displayName: "Logout User",
      email,
      password: "password123",
    });
    expect(registered.status).toBe(201);
    const refreshToken = registered.body.refreshToken as string;

    const loggedOut = await request(app).post("/api/auth/logout").send({ refreshToken });
    expect(loggedOut.status).toBe(204);

    const refresh = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(refresh.status).toBe(401);
  });
});
