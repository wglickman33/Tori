import {
  fetchGroqChat,
  type GroqChatFailure,
  type GroqChatMessage,
} from "./groqChat.js";
import { isToriOffTopic, toriOffTopicReply, type ToriLocale } from "./toriGuardrails.js";
import { executeToriTool, extractMatchedItems, parseToriPendingAction, TORI_TOOLS, type ToriMatchedItem, type ToriPendingAction } from "./toriTools.js";
import { parseJsonValue } from "./sse.js";
import { buildToriAgentMessages, toriDeveloperInstructions } from "./toriPrompts.js";

export { TORI_SYSTEM_PROMPT, TORI_SYSTEM_PROMPT_ES } from "./toriPrompts.js";

export function toriSystemPrompt(locale: ToriLocale = "en"): string {
  return toriDeveloperInstructions(locale);
}

export const MAX_TORI_TOOL_ROUNDS = 6;

export type ToriAgentEvent =
  | { type: "tool.start"; id: string; name: string; input: unknown }
  | { type: "tool.result"; id: string; name: string; input: unknown; output: unknown };

export type ToriAgentSuccess = {
  ok: true;
  reply: string;
  pendingAction?: ToriPendingAction;
  matchedItems?: ToriMatchedItem[];
};
export type ToriAgentResult = ToriAgentSuccess | GroqChatFailure;

type FetchGroqChat = typeof fetchGroqChat;
type ExecuteTool = typeof executeToriTool;

export async function runToriAgent(
  userId: string,
  householdId: string,
  conversation: { role: "user" | "assistant"; content: string }[],
  options: {
    apiKey: string;
    fetchGroqChat?: FetchGroqChat;
    executeTool?: ExecuteTool;
    onEvent?: (event: ToriAgentEvent) => void;
    locale?: ToriLocale;
  }
): Promise<ToriAgentResult> {
  const callGroq = options.fetchGroqChat ?? fetchGroqChat;
  const runTool = options.executeTool ?? executeToriTool;
  const locale = options.locale === "es" ? "es" : "en";

  const messages: GroqChatMessage[] = buildToriAgentMessages(locale, conversation);

  const lastUser = [...conversation].reverse().find((message) => message.role === "user");
  if (lastUser && isToriOffTopic(lastUser.content)) {
    return { ok: true, reply: toriOffTopicReply(locale) };
  }

  let pendingAction: ToriPendingAction | undefined;
  let matchedItems: ToriMatchedItem[] | undefined;

  for (let round = 0; round < MAX_TORI_TOOL_ROUNDS; round += 1) {
    const result = await callGroq(messages, {
      apiKey: options.apiKey,
      tools: TORI_TOOLS,
    });
    if (!result.ok) return result;

    if (result.kind === "reply") {
      const payload: ToriAgentSuccess = { ok: true, reply: result.reply };
      if (pendingAction) payload.pendingAction = pendingAction;
      if (matchedItems?.length) payload.matchedItems = matchedItems;
      return payload;
    }

    messages.push(result.message);
    for (const call of result.toolCalls) {
      const input = parseJsonValue(call.function.arguments);
      options.onEvent?.({
        type: "tool.start",
        id: call.id,
        name: call.function.name,
        input,
      });
      const content = await runTool(userId, householdId, call.function.name, call.function.arguments);
      const output = parseJsonValue(content);
      options.onEvent?.({
        type: "tool.result",
        id: call.id,
        name: call.function.name,
        input,
        output,
      });
      const proposed = parseToriPendingAction(call.function.name, content);
      if (proposed) pendingAction = proposed;
      const listed = extractMatchedItems(call.function.name, output);
      if (listed?.length) matchedItems = listed;
      messages.push({
        role: "tool",
        tool_call_id: call.id,
        name: call.function.name,
        content,
      });
    }
  }

  return {
    ok: false,
    status: 502,
    error: "Tori AI could not finish looking that up. Try a simpler question.",
  };
}
