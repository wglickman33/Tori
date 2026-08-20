import { describe, it, expect, vi } from "vitest";
import { runToriAgent, MAX_TORI_TOOL_ROUNDS, TORI_SYSTEM_PROMPT, TORI_SYSTEM_PROMPT_ES } from "./toriAgent.js";
import type { GroqChatMessage, GroqChatResult } from "./groqChat.js";

const USER_ID = "11111111-1111-1111-1111-111111111111";
const HOUSEHOLD_ID = "22222222-2222-4222-8222-222222222222";

describe("runToriAgent", () => {
  it("sends a system prompt that stays with household inventory", () => {
    expect(TORI_SYSTEM_PROMPT).toMatch(/follow the user's latest request/i);
    expect(TORI_SYSTEM_PROMPT).toMatch(/never invent facts about THEIR Tori data/i);
    expect(TORI_SYSTEM_PROMPT).toMatch(/politics, presidents, news, taxes/i);
    expect(TORI_SYSTEM_PROMPT).toMatch(/search_items/i);
    expect(TORI_SYSTEM_PROMPT).toMatch(/get_expiring/i);
    expect(TORI_SYSTEM_PROMPT).toMatch(/propose_add_item/i);
    expect(TORI_SYSTEM_PROMPT).toMatch(/Confirm \/ Not now/);
    expect(TORI_SYSTEM_PROMPT).toMatch(/do not list items in markdown tables/i);
    expect(TORI_SYSTEM_PROMPT_ES).toMatch(/no listes artículos en tablas markdown/i);
    expect(MAX_TORI_TOOL_ROUNDS).toBe(6);
  });

  it("uses a Latin American Spanish system prompt when locale is es", () => {
    expect(TORI_SYSTEM_PROMPT_ES).toMatch(/español latinoamericano/i);
    expect(TORI_SYSTEM_PROMPT_ES).toMatch(/nunca inventes/i);
    expect(TORI_SYSTEM_PROMPT_ES).toMatch(/Confirmar \/ Ahora no/);
    expect(TORI_SYSTEM_PROMPT_ES).toMatch(/search_items/i);
  });

  it("refuses Spanish off-topic questions in Spanish without calling Groq", async () => {
    const fetchGroqChat = vi.fn();
    const executeTool = vi.fn();
    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "¿Quién fue el último presidente?" }],
      { apiKey: "key", fetchGroqChat, executeTool, locale: "es" }
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reply).toMatch(/inventario del hogar/i);
    expect(fetchGroqChat).not.toHaveBeenCalled();
    expect(executeTool).not.toHaveBeenCalled();
  });

  it("sends the Spanish system prompt to Groq when locale is es", async () => {
    const fetchGroqChat = vi.fn().mockResolvedValue({
      ok: true,
      kind: "reply",
      reply: "Consejo general: guarda la leche fría.",
    });

    await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "¿Cómo guardo la leche?" }],
      { apiKey: "key", fetchGroqChat, locale: "es" }
    );

    expect(fetchGroqChat).toHaveBeenCalledTimes(1);
    const [messages] = fetchGroqChat.mock.calls[0] as [GroqChatMessage[]];
    expect(messages[0]?.content).toBe(TORI_SYSTEM_PROMPT_ES);
  });

  it("refuses off-topic questions without calling Groq or tools", async () => {
    const fetchGroqChat = vi.fn();
    const executeTool = vi.fn();
    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "Who was the last president?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reply).toMatch(/household inventory/i);
    expect(fetchGroqChat).not.toHaveBeenCalled();
    expect(executeTool).not.toHaveBeenCalled();
  });

  it("returns a plain reply without executing tools", async () => {
    const fetchGroqChat = vi.fn().mockResolvedValue({
      ok: true,
      kind: "reply",
      reply: "General advice: keep milk cold.",
    });
    const executeTool = vi.fn();

    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "How should I store milk?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result).toEqual({ ok: true, reply: "General advice: keep milk cold." });
    expect(executeTool).not.toHaveBeenCalled();
    expect(fetchGroqChat).toHaveBeenCalledTimes(1);
    const [, options] = fetchGroqChat.mock.calls[0] as [GroqChatMessage[], { tools: unknown[] }];
    expect(options.tools).toHaveLength(12);
  });

  it("forwards Groq failures", async () => {
    const fetchGroqChat = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      error: "Tori AI is busy right now. Try again in a moment.",
    });

    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "Hi" }],
      { apiKey: "key", fetchGroqChat }
    );

    expect(result).toMatchObject({ ok: false, status: 429 });
  });

  it("runs a short tool chain then returns the model reply", async () => {
    const fetchGroqChat = vi
      .fn()
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
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Milk is in the fridge.",
      } satisfies GroqChatResult);

    const executeTool = vi.fn().mockResolvedValue(
      JSON.stringify({ count: 1, items: [{ id: "item-1", name: "Milk", location: "Fridge" }] })
    );

    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "Do we have milk?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result).toEqual({
      ok: true,
      reply: "Milk is in the fridge.",
      matchedItems: [
        {
          id: "item-1",
          name: "Milk",
          location: "Fridge",
          quantity: 1,
          price: null,
          folderName: null,
          tags: [],
          expirationDate: undefined,
        },
      ],
    });
    expect(executeTool).toHaveBeenCalledTimes(1);
    expect(executeTool).toHaveBeenCalledWith(USER_ID, HOUSEHOLD_ID, "search_items", '{"query":"milk"}');
    expect(fetchGroqChat).toHaveBeenCalledTimes(2);
  });

  it("emits live tool events as each lookup starts and finishes", async () => {
    const fetchGroqChat = vi
      .fn()
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
              function: { name: "get_expiring", arguments: '{"within_days":7}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "get_expiring", arguments: '{"within_days":7}' },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Yogurt expires in 2 days.",
      } satisfies GroqChatResult);
    const executeTool = vi.fn().mockResolvedValue(
      JSON.stringify({ count: 1, items: [{ name: "Yogurt", daysUntil: 2 }] })
    );
    const onEvent = vi.fn();

    await runToriAgent(USER_ID, HOUSEHOLD_ID, [{ role: "user", content: "What's expiring?" }], {
      apiKey: "key",
      fetchGroqChat,
      executeTool,
      onEvent,
    });

    expect(onEvent.mock.calls.map((call) => call[0])).toEqual([
      {
        type: "tool.start",
        id: "call_1",
        name: "get_expiring",
        input: { within_days: 7 },
      },
      {
        type: "tool.result",
        id: "call_1",
        name: "get_expiring",
        input: { within_days: 7 },
        output: { count: 1, items: [{ name: "Yogurt", daysUntil: 2 }] },
      },
    ]);
  });

  it("passes empty search results back to the model instead of inventing items", async () => {
    const fetchGroqChat = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_empty",
              type: "function",
              function: { name: "search_items", arguments: '{"query":"saffron"}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_empty",
            type: "function",
            function: { name: "search_items", arguments: '{"query":"saffron"}' },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "I could not find saffron in this household.",
      } satisfies GroqChatResult);
    const executeTool = vi.fn().mockResolvedValue(JSON.stringify({ count: 0, items: [] }));

    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "Do we have saffron?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result).toEqual({ ok: true, reply: "I could not find saffron in this household." });
    expect(executeTool).toHaveBeenCalledTimes(1);
  });

  it("returns matchedItems from the last listing tool", async () => {
    const fetchGroqChat = vi
      .fn()
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
              function: { name: "search_items", arguments: '{"query":"charger"}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_1",
            type: "function",
            function: { name: "search_items", arguments: '{"query":"charger"}' },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Found two chargers.",
      } satisfies GroqChatResult);

    const executeTool = vi.fn().mockResolvedValue(
      JSON.stringify({
        count: 2,
        items: [
          { id: "a", name: "iPhone Charger", location: "Desk", quantity: 1, price: null, folderName: null, tags: [] },
          { id: "b", name: "Computer Charger", location: "Desk", quantity: 1, price: null, folderName: null, tags: [] },
        ],
      })
    );

    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "Where are my chargers?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.matchedItems).toHaveLength(2);
      expect(result.matchedItems?.[0]?.name).toBe("iPhone Charger");
    }
  });

  it("stops after MAX_TORI_TOOL_ROUNDS", async () => {
    const fetchGroqChat = vi.fn().mockResolvedValue({
      ok: true,
      kind: "tool_calls",
      message: {
        role: "assistant",
        content: null,
        tool_calls: [
          {
            id: "call_loop",
            type: "function",
            function: { name: "search_items", arguments: '{"query":"milk"}' },
          },
        ],
      },
      toolCalls: [
        {
          id: "call_loop",
          type: "function",
          function: { name: "search_items", arguments: '{"query":"milk"}' },
        },
      ],
    } satisfies GroqChatResult);
    const executeTool = vi.fn().mockResolvedValue(JSON.stringify({ count: 0, items: [] }));

    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "Do we have milk?" }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result).toMatchObject({ ok: false, status: 502 });
    expect(fetchGroqChat).toHaveBeenCalledTimes(MAX_TORI_TOOL_ROUNDS);
    expect(executeTool).toHaveBeenCalledTimes(MAX_TORI_TOOL_ROUNDS);
  });

  it("returns a pending add without claiming it was written", async () => {
    const fetchGroqChat = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        kind: "tool_calls",
        message: {
          role: "assistant",
          content: null,
          tool_calls: [
            {
              id: "call_search",
              type: "function",
              function: { name: "search_items", arguments: '{"query":"milk"}' },
            },
          ],
        },
        toolCalls: [
          {
            id: "call_search",
            type: "function",
            function: { name: "search_items", arguments: '{"query":"milk"}' },
          },
        ],
      } satisfies GroqChatResult)
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
                arguments: '{"name":"Milk","location":"Fridge","quantity":1}',
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
              arguments: '{"name":"Milk","location":"Fridge","quantity":1}',
            },
          },
        ],
      } satisfies GroqChatResult)
      .mockResolvedValueOnce({
        ok: true,
        kind: "reply",
        reply: "Nothing expiring besides yogurt. Want me to add milk to the fridge?",
      } satisfies GroqChatResult);

    const executeTool = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ count: 0, items: [] }))
      .mockResolvedValueOnce(
        JSON.stringify({
          needsConfirmation: true,
          added: false,
          type: "add_item",
          item: {
            name: "Milk",
            quantity: 1,
            location: "Fridge",
            folderId: null,
            expirationDate: null,
            purchaseDate: null,
            tags: [],
            price: null,
          },
        })
      );

    const result = await runToriAgent(
      USER_ID,
      HOUSEHOLD_ID,
      [{ role: "user", content: "What's expiring this week, and add milk to the fridge if we don't have it." }],
      { apiKey: "key", fetchGroqChat, executeTool }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.pendingAction).toEqual({
        type: "add_item",
        item: {
          name: "Milk",
          quantity: 1,
          location: "Fridge",
          folderId: null,
          expirationDate: null,
          purchaseDate: null,
          tags: [],
          price: null,
        },
      });
    }
    expect(executeTool).toHaveBeenCalledTimes(2);
  });
});
