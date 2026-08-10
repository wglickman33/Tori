import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "./app.js";

describe("createApp", () => {
  it("responds to health checks", async () => {
    const app = createApp();
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("rejects unauthenticated household access", async () => {
    const app = createApp();
    const res = await request(app).get("/api/households/mine");
    expect(res.status).toBe(401);
    expect(res.body.error).toBeTruthy();
  });
});
