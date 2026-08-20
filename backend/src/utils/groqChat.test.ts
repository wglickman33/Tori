import { describe, it, expect, vi } from "vitest";
import {
  fetchGroqChat,
  parseGroqChatPayload,
  GROQ_CHAT_URL,
  GROQ_CHAT_MODEL,
} from "./groqChat.js";

describe("parseGroqChatPayload", () => {
  it("reads assistant content from a chat completion payload", () => {
    expect(
      parseGroqChatPayload({
        choices: [{ message: { role: "assistant", content: "  Store rice dry.  " } }],
      })
    ).toBe("Store rice dry.");
  });

  it("returns null for empty or malformed payloads", () => {
    expect(parseGroqChatPayload(null)).toBeNull();
    expect(parseGroqChatPayload({})).toBeNull();
    expect(parseGroqChatPayload({ choices: [] })).toBeNull();
    expect(parseGroqChatPayload({ choices: [{ message: { content: "   " } }] })).toBeNull();
  });
});

describe("fetchGroqChat", () => {
  it("posts messages to Groq and returns the reply", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: "Keep milk in the fridge." } }],
      }),
    });

    const result = await fetchGroqChat(
      [{ role: "user", content: "How should I store milk?" }],
      { apiKey: "test-key", fetchFn }
    );

    expect(result).toEqual({ ok: true, kind: "reply", reply: "Keep milk in the fridge." });
    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, init] = fetchFn.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(GROQ_CHAT_URL);
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer test-key");
    const body = JSON.parse(String(init.body));
    expect(body.model).toBe(GROQ_CHAT_MODEL);
    expect(body.messages[0].content).toBe("How should I store milk?");
    expect(body.tools).toBeUndefined();
  });

  it("forwards tool definitions and parses tool_calls", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
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
          },
        ],
      }),
    });

    const tools = [
      {
        type: "function" as const,
        function: { name: "search_items", description: "Search", parameters: { type: "object" } },
      },
    ];
    const result = await fetchGroqChat([{ role: "user", content: "Do we have milk?" }], {
      apiKey: "test-key",
      fetchFn,
      tools,
    });

    expect(result).toMatchObject({
      ok: true,
      kind: "tool_calls",
      toolCalls: [{ id: "call_1", function: { name: "search_items" } }],
    });
    const body = JSON.parse(String(fetchFn.mock.calls[0][1].body));
    expect(body.tools).toEqual(tools);
    expect(body.tool_choice).toBe("auto");
  });

  it("maps 429 to a clear busy message", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });

    const result = await fetchGroqChat([{ role: "user", content: "Hi" }], {
      apiKey: "test-key",
      fetchFn,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(429);
      expect(result.error).toBe("Tori AI is busy right now. Try again in a moment.");
    }
  });

  it("maps other Groq failures to a clear 502 message", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const result = await fetchGroqChat([{ role: "user", content: "Hi" }], {
      apiKey: "test-key",
      fetchFn,
    });

    expect(result).toEqual({
      ok: false,
      status: 502,
      error: "Tori AI could not reply right now. Try again.",
    });
  });

  it("maps network failure to a generic error", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("network"));
    const result = await fetchGroqChat([{ role: "user", content: "Hi" }], {
      apiKey: "test-key",
      fetchFn,
    });
    expect(result).toMatchObject({ ok: false, status: 502 });
  });

  it("maps abort to a timeout error", async () => {
    const abortErr = new Error("aborted");
    abortErr.name = "AbortError";
    const fetchFn = vi.fn().mockRejectedValue(abortErr);
    const result = await fetchGroqChat([{ role: "user", content: "Hi" }], {
      apiKey: "test-key",
      fetchFn,
    });
    expect(result).toMatchObject({ ok: false, status: 504 });
  });
});
