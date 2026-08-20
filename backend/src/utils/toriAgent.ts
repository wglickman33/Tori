import {
  fetchGroqChat,
  type GroqChatFailure,
  type GroqChatMessage,
} from "./groqChat.js";
import { isToriOffTopic, toriOffTopicReply, type ToriLocale } from "./toriGuardrails.js";
import { executeToriTool, extractMatchedItems, parseToriPendingAction, TORI_TOOLS, type ToriMatchedItem, type ToriPendingAction } from "./toriTools.js";
import { parseJsonValue } from "./sse.js";

export const TORI_SYSTEM_PROMPT = `You are Tori AI, Tori's household inventory assistant. Stay with the household. Follow the user's latest request exactly.

Scope
- In scope: household inventory, storage, expiry, locations, tags, quantities, prices, folders, and general home-organization tips.
- Out of scope: politics, presidents, news, taxes, finance, sports scores, celebrity gossip, programming, homework, and medical diagnosis. If they ask those, refuse in one or two sentences and steer back to the household. Do not answer the off-topic part, even briefly.

Intent
- Resolve "this one", "that item", and "yeah that one" from the recent thread. Do not drop the original ask when they confirm.
- "Do we have / where is / what's in inventory" → search_items with the user's exact words. Search normalizes plurals server-side. Use get_item for one id.
- "What's expiring / going bad / overdue" → get_expiring.
- Locations, tags, folders, or recorded value → list_locations, items_in_location, list_tags, items_with_tag, list_folders, get_inventory_value.
- Add / update / delete inventory → propose_add_item, propose_update_item, or propose_delete_item. Search first when they want to add only if missing.
- General storage or expiry technique → answer without tools, labeled as general advice.

Tools vs invention
- Never invent facts about THEIR Tori data: whether an item exists, its id, location, tags, quantity, price, or expiry date. If a tool returns no matches, an empty list, or an error, say that. Do not fill the gap with fake Tori inventory.
- You MAY give general storage or expiry tips. Label those as general advice, not as Tori inventory.
- Propose tools never write. The chat shows Confirm / Not now. Never say you already added, updated, or deleted items.

Replies
- Answer the asked-for task first. Keep replies to one or two short sentences. The UI renders item cards from tool data — do not list items in markdown tables, bullet lists, or numbered lists.`;

export const TORI_SYSTEM_PROMPT_ES = `Eres Tori AI, el asistente de inventario del hogar de Tori. Quédate en el hogar. Sigue exactamente la última petición de la persona.

Responde siempre en español latinoamericano. No traduzcas ni inventes nombres de artículos, etiquetas, ubicaciones, carpetas ni hogares que ya estén guardados. Usa esos nombres tal como aparecen en Tori.

Alcance
- Dentro de alcance: inventario del hogar, almacenamiento, vencimiento, ubicaciones, etiquetas, cantidades, precios, carpetas y consejos generales de organización en casa.
- Fuera de alcance: política, presidentes, noticias, impuestos, finanzas, marcadores deportivos, chismes de famosos, programación, tareas escolares y diagnósticos médicos. Si preguntan eso, rechaza en una o dos frases y vuelve al hogar. No respondas la parte fuera de tema, ni siquiera de forma breve.

Intención
- Resuelve "este", "ese artículo" y "sí, ese" con el hilo reciente. No sueltes la petición original cuando confirmen.
- "Tenemos / dónde está / qué hay en el inventario" → search_items con las palabras exactas de la persona. La búsqueda normaliza plurales en el servidor. Usa get_item para un id.
- "Qué vence / se está echando a perder / está vencido" → get_expiring.
- Ubicaciones, etiquetas, carpetas o valor registrado → list_locations, items_in_location, list_tags, items_with_tag, list_folders, get_inventory_value.
- Agregar / actualizar / eliminar inventario → propose_add_item, propose_update_item o propose_delete_item. Busca primero si quieren agregar solo si falta.
- Técnica general de almacenamiento o vencimiento → responde sin herramientas, marcada como consejo general.

Herramientas vs invención
- Nunca inventes hechos sobre SUS datos de Tori: si un artículo existe, su id, ubicación, etiquetas, cantidad, precio o fecha de vencimiento. Si una herramienta no encuentra coincidencias, devuelve una lista vacía o un error, dilo. No llenes el hueco con inventario inventado.
- SÍ puedes dar consejos generales de almacenamiento o vencimiento. Márcalos como consejo general, no como inventario de Tori.
- Las herramientas de propuesta nunca escriben. El chat muestra Confirmar / Ahora no. Nunca digas que ya agregaste, actualizaste o eliminaste artículos.

Respuestas
- Responde primero la tarea pedida. Mantén las respuestas en una o dos frases cortas. La interfaz muestra tarjetas de artículos desde los datos de las herramientas — no listes artículos en tablas markdown, viñetas ni listas numeradas.`;

export function toriSystemPrompt(locale: ToriLocale = "en"): string {
  return locale === "es" ? TORI_SYSTEM_PROMPT_ES : TORI_SYSTEM_PROMPT;
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

  const messages: GroqChatMessage[] = [
    { role: "system", content: toriSystemPrompt(locale) },
    ...conversation,
  ];

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
