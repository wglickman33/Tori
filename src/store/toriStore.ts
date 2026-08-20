import { create } from "zustand";
import {
  toriApi,
  type ItemInput,
  type ToriChatMessage,
  type ToriMatchedItem,
  type ToriPendingAction,
  type ToriProposedItem,
  type ToriStreamEvent,
} from "../api/client";
import i18n from "../i18n";
import { translateError } from "../i18n/apiErrors";
import { useHouseholdStore } from "./householdStore";
import { useInventoryStore } from "./inventoryStore";
import { toastError, toastSuccess } from "./toastStore";
import { applyToriTraceEvent, type ToriTraceStep } from "../utils/toriTrace";

export function getToriAiSuggestions(): string[] {
  return [
    i18n.t("ai.suggestionExpiring"),
    i18n.t("ai.suggestionTowels"),
    i18n.t("ai.suggestionFridge"),
  ];
}

export type PendingStatus = "idle" | "confirming" | "done" | "dismissed";

export type ChatTurn =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      matchedItems?: ToriMatchedItem[];
      pendingAction?: ToriPendingAction;
      pendingStatus?: PendingStatus;
    };

const initialChat = {
  messages: [] as ChatTurn[],
  draft: "",
  sending: false,
  threadError: null as string | null,
  traceSteps: [] as ToriTraceStep[],
};

function toApiMessages(turns: ChatTurn[]): ToriChatMessage[] {
  return turns.map((turn) => ({ role: turn.role, content: turn.content }));
}

function proposedToInput(item: ToriProposedItem): ItemInput {
  return {
    name: item.name,
    quantity: item.quantity,
    location: item.location,
    folderId: item.folderId,
    expirationDate: item.expirationDate,
    purchaseDate: item.purchaseDate,
    tags: item.tags,
    price: item.price,
  };
}

async function ensureInventoryLoaded(householdId: string): Promise<void> {
  const inventory = useInventoryStore.getState();
  if (inventory.householdId !== householdId || inventory.error) {
    await inventory.load(householdId);
  }
  const next = useInventoryStore.getState();
  if (next.householdId !== householdId) {
    throw new Error(i18n.t("ai.joinToConfirm"));
  }
  if (next.error) throw new Error(next.error);
}

export function pendingActionTitle(action: ToriPendingAction): string {
  if (action.type === "add_item") return i18n.t("ai.addConfirm", { name: action.item.name });
  if (action.type === "update_item") return i18n.t("ai.updateConfirm", { name: action.itemName });
  return i18n.t("ai.deleteConfirm", { name: action.itemName });
}

export function pendingActionDone(action: ToriPendingAction): string {
  if (action.type === "add_item") return i18n.t("ai.added", { name: action.item.name });
  if (action.type === "update_item") return i18n.t("ai.updated", { name: action.itemName });
  return i18n.t("ai.deleted", { name: action.itemName });
}

export function pendingActionConfirming(action: ToriPendingAction): string {
  if (action.type === "add_item") return i18n.t("ai.adding");
  if (action.type === "update_item") return i18n.t("ai.updating");
  return i18n.t("ai.deleting");
}

const PATCH_FIELD_KEYS: Record<string, string> = {
  name: "inventory.name",
  quantity: "common.quantity",
  location: "inventory.location",
  folderId: "inventory.folder",
  expirationDate: "inventory.expirationDate",
  purchaseDate: "inventory.purchaseDate",
  tags: "inventory.tags",
  price: "inventory.price",
};

export function pendingActionDetails(action: ToriPendingAction): string[] {
  if (action.type === "add_item") {
    const { item } = action;
    const parts = [i18n.t("common.qty", { count: item.quantity })];
    if (item.location) parts.push(item.location);
    if (item.expirationDate) parts.push(i18n.t("inventory.expiresShort", { label: item.expirationDate }));
    return [parts.join(", ")];
  }
  if (action.type === "update_item") {
    return Object.entries(action.patch)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        const field = PATCH_FIELD_KEYS[key] ? i18n.t(PATCH_FIELD_KEYS[key]) : key;
        const display = Array.isArray(value)
          ? value.join(", ")
          : (value ?? i18n.t("inventory.none"));
        return `${field}: ${display}`;
      });
  }
  return [];
}

function toastForAction(action: ToriPendingAction): string {
  if (action.type === "add_item") return i18n.t("inventory.itemAdded", { name: action.item.name });
  if (action.type === "update_item") return i18n.t("inventory.itemUpdated", { name: action.itemName });
  return i18n.t("inventory.itemDeletedNamed", { name: action.itemName });
}

interface ToriAiState {
  widgetOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  messages: ChatTurn[];
  draft: string;
  sending: boolean;
  threadError: string | null;
  traceSteps: ToriTraceStep[];
  setDraft: (draft: string) => void;
  send: (raw?: string) => Promise<void>;
  confirmAction: (index: number) => Promise<void>;
  dismissAction: (index: number) => void;
  resetChat: () => void;
}

export const useToriStore = create<ToriAiState>((set, get) => ({
  widgetOpen: false,
  openWidget: () => set({ widgetOpen: true }),
  closeWidget: () => set({ widgetOpen: false }),
  ...initialChat,
  setDraft: (draft) => set({ draft }),
  resetChat: () => set({ ...initialChat }),
  send: async (raw) => {
    const { sending, messages, draft } = get();
    const content = (raw ?? draft).trim();
    if (!content || sending) return;

    const dismissed = messages.map((turn) =>
      turn.role === "assistant" && turn.pendingStatus === "idle"
        ? { ...turn, pendingStatus: "dismissed" as const }
        : turn
    );
    const nextMessages: ChatTurn[] = [...dismissed, { role: "user", content }];
    set({
      sending: true,
      draft: "",
      threadError: null,
      traceSteps: [],
      messages: nextMessages,
    });

    const householdId = useHouseholdStore.getState().household?.id;
    if (!householdId) {
      const message = i18n.t("ai.joinToChat");
      toastError(message);
      set({ threadError: message, sending: false });
      return;
    }

    try {
      const { reply, pendingAction, matchedItems } = await toriApi.chatStream(
        toApiMessages(nextMessages),
        householdId,
        (event: ToriStreamEvent) => {
          set({ traceSteps: applyToriTraceEvent(get().traceSteps, event) });
        }
      );
      set({
        messages: [
          ...nextMessages,
          {
            role: "assistant",
            content: reply,
            matchedItems,
            pendingAction,
            pendingStatus: pendingAction ? "idle" : undefined,
          },
        ],
        sending: false,
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : i18n.t("errors.toriReplyGeneric");
      const message = translateError(raw, i18n.t.bind(i18n));
      toastError(message);
      set({
        threadError: message,
        draft: content,
        messages,
        sending: false,
      });
    }
  },
  confirmAction: async (index) => {
    const turn = get().messages[index];
    if (turn?.role !== "assistant" || !turn.pendingAction || turn.pendingStatus !== "idle") return;

    const householdId = useHouseholdStore.getState().household?.id;
    if (!householdId) {
      toastError(i18n.t("ai.joinToConfirm"));
      return;
    }

    set({
      messages: get().messages.map((item, i) =>
        i === index && item.role === "assistant" ? { ...item, pendingStatus: "confirming" } : item
      ),
    });

    try {
      await ensureInventoryLoaded(householdId);
      const inventory = useInventoryStore.getState();
      const action = turn.pendingAction;
      if (action.type === "add_item") {
        await inventory.createItem(proposedToInput(action.item));
      } else if (action.type === "update_item") {
        await inventory.updateItem(action.itemId, action.patch as Partial<ItemInput>);
      } else {
        await inventory.deleteItem(action.itemId);
      }
      toastSuccess(toastForAction(action));
      set({
        messages: get().messages.map((item, i) =>
          i === index && item.role === "assistant" ? { ...item, pendingStatus: "done" } : item
        ),
      });
    } catch (err) {
      const raw = err instanceof Error ? err.message : i18n.t("ai.couldNotSaveChange");
      toastError(translateError(raw, i18n.t.bind(i18n)));
      set({
        messages: get().messages.map((item, i) =>
          i === index && item.role === "assistant" ? { ...item, pendingStatus: "idle" } : item
        ),
      });
    }
  },
  dismissAction: (index) => {
    set({
      messages: get().messages.map((item, i) =>
        i === index && item.role === "assistant" ? { ...item, pendingStatus: "dismissed" } : item
      ),
    });
  },
}));
