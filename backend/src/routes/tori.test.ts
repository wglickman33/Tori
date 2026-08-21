import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import "dotenv/config";

const fetchGroqChat = vi.fn();

vi.mock("../utils/groqChat.js", () => ({
  fetchGroqChat: (...args: unknown[]) => fetchGroqChat(...args),
}));

const { createApp } = await import("../app.js");
const { sequelize } = await import("../db/sequelize.js");
await import("../models/index.js");

const app = createApp();
const suffix = Date.now();

describe("POST /api/tori/chat", () => {
  let accessToken = "";
  let outsiderToken = "";
  let householdId = "";

  beforeAll(async () => {
    await sequelize.authenticate();
    await sequelize.sync();

    const registered = await request(app).post("/api/auth/register").send({
      displayName: "Tori AI User",
      email: `tori-ai-${suffix}@example.com`,
      password: "password123",
    });
    accessToken = registered.body.accessToken as string;

    const house = await request(app)
      .post("/api/households")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "AI House" });
    householdId = house.body.household.id as string;

    await request(app)
      .post(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Milk", location: "Fridge", quantity: 1 });

    const outsider = await request(app).post("/api/auth/register").send({
      displayName: "Outsider",
      email: `tori-ai-out-${suffix}@example.com`,
      password: "password123",
    });
    outsiderToken = outsider.body.accessToken as string;
  });

  beforeEach(() => {
    fetchGroqChat.mockReset();
    delete process.env.GROQ_API_KEY;
  });

  function chatBody(messages: unknown) {
    return { householdId, messages };
  }

  it("requires authentication", async () => {
    const res = await request(app)
      .post("/api/tori/chat")
      .send(chatBody([{ role: "user", content: "Hi" }]));

    expect(res.status).toBe(401);
    expect(fetchGroqChat).not.toHaveBeenCalled();
  });

  it("rejects an empty messages array", async () => {
    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(chatBody([]));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/at least one message/i);
  });

  it("rejects a last message that is not from the user", async () => {
    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(chatBody([{ role: "assistant", content: "Hello" }]));

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/last message/i);
  });

  it("returns 403 when the user is not a household member", async () => {
    process.env.GROQ_API_KEY = "test-key";
    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${outsiderToken}`)
      .send(chatBody([{ role: "user", content: "Do we have milk?" }]));

    expect(res.status).toBe(403);
    expect(fetchGroqChat).not.toHaveBeenCalled();
  });

  it("returns 503 when Groq is not configured", async () => {
    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(chatBody([{ role: "user", content: "Hi" }]));

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/not configured/i);
    expect(fetchGroqChat).not.toHaveBeenCalled();
  });

  it("refuses off-topic questions without Groq", async () => {
    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(chatBody([{ role: "user", content: "Who was the last president?" }]));

    expect(res.status).toBe(200);
    expect(res.body.reply).toMatch(/household inventory/i);
    expect(fetchGroqChat).not.toHaveBeenCalled();
  });

  it("returns Spanish off-topic copy when locale is es", async () => {
    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        householdId,
        messages: [{ role: "user", content: "¿Quién fue el último presidente?" }],
        locale: "es",
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toMatch(/inventario del hogar/i);
    expect(fetchGroqChat).not.toHaveBeenCalled();
  });

  it("proxies a reply when Groq is configured", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat.mockResolvedValue({
      ok: true,
      kind: "reply",
      reply: "General advice: keep milk cold.",
    });

    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(chatBody([{ role: "user", content: "How should I store milk?" }]));

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("General advice: keep milk cold.");
    expect(fetchGroqChat).toHaveBeenCalledTimes(1);
    const [messages, options] = fetchGroqChat.mock.calls[0] as [
      { role: string; content: string }[],
      { apiKey: string; tools: unknown[] },
    ];
    expect(options.apiKey).toBe("test-key");
    expect(options.tools).toHaveLength(12);
    expect(messages[0].role).toBe("system");
    expect(messages[1].role).toBe("developer");
    expect(messages[2]).toEqual({
      role: "user",
      content: "How should I store milk?",
    });
  });

  it("runs search_items when Groq asks for it", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "search_items", arguments: '{"query":"milk"}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "search_items", arguments: '{"query":"milk"}' },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Milk is in the fridge.",
      });

    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(chatBody([{ role: "user", content: "Do we have milk?" }]));

    expect(res.status).toBe(200);
    expect(res.body.reply).toBe("Milk is in the fridge.");
    expect(fetchGroqChat).toHaveBeenCalledTimes(2);
    const toolMessage = fetchGroqChat.mock.calls[1][0].find(
      (message: { role: string }) => message.role === "tool"
    );
    expect(toolMessage.content).toMatch(/Milk/);
  });

  it("forwards Groq rate-limit failures", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat.mockResolvedValue({
      ok: false,
      status: 429,
      error: "Tori AI is busy right now. Try again in a moment.",
    });

    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(chatBody([{ role: "user", content: "Hi" }]));

    expect(res.status).toBe(429);
    expect(res.body.error).toMatch(/busy/i);
  });

  it("returns a pending add without writing an item", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_add",
              type: "function",
              function: {
                name: "propose_add_item",
                arguments: '{"name":"Oats","location":"Pantry","quantity":1}',
              },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_add",
            type: "function",
            function: {
              name: "propose_add_item",
              arguments: '{"name":"Oats","location":"Pantry","quantity":1}',
            },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Want me to add oats to the pantry?",
      });

    const before = await request(app)
      .get(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`);

    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(chatBody([{ role: "user", content: "Add oats to the pantry" }]));

    expect(res.status).toBe(200);
    expect(res.body.pendingAction.type).toBe("add_item");
    expect(res.body.pendingAction.item.name).toBe("Oats");

    const after = await request(app)
      .get(`/api/households/${householdId}/items`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(after.body.items).toHaveLength(before.body.items.length);
  });

  it("streams tool events when the client asks for SSE", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_1",
              type: "function",
              function: { name: "search_items", arguments: '{"query":"milk"}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "search_items", arguments: '{"query":"milk"}' },
          },
        ],
      })
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Milk is in the fridge.",
      });

    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Accept", "text/event-stream")
      .send(chatBody([{ role: "user", content: "Do we have milk?" }]));

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(res.text).toContain("event: tool.start");
    expect(res.text).toContain("event: tool.result");
    expect(res.text).toContain("event: reply");
    expect(res.text).toContain("Milk is in the fridge.");
  });

  it("streams Groq failures as an error event", async () => {
    process.env.GROQ_API_KEY = "test-key";
    fetchGroqChat.mockResolvedValue({
      ok: false,
      status: 429,
      error: "Tori AI is busy right now. Try again in a moment.",
    });

    const res = await request(app)
      .post("/api/tori/chat")
      .set("Authorization", `Bearer ${accessToken}`)
      .set("Accept", "text/event-stream")
      .send(chatBody([{ role: "user", content: "Hi" }]));

    expect(res.status).toBe(200);
    expect(res.text).toContain("event: error");
    expect(res.text).toMatch(/busy/i);
  });
});
