import { create } from "zustand";
import {
  toriApi,
  type ItemInput,
  type ToriChatMessage,
  type ToriPendingAction,
  type ToriProposedItem,
  type ToriStreamEvent,
} from "../api/client";
import { useHouseholdStore } from "./householdStore";
import { useInventoryStore } from "./inventoryStore";
import { toastError, toastSuccess } from "./toastStore";
import { applyToriTraceEvent, type ToriTraceStep } from "../utils/toriTrace";

export const TORI_AI_SUGGESTIONS = [
  "What's expiring this week?",
  "Where is the extra paper towels?",
  "What's in the fridge?",
] as const;

export type PendingStatus = "idle" | "confirming" | "done" | "dismissed";

export type ChatTurn =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
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
    throw new Error("Join a household to confirm this change.");
  }
  if (next.error) throw new Error(next.error);
}

export function pendingActionTitle(action: ToriPendingAction): string {
  if (action.type === "add_item") return `Add ${action.item.name}?`;
  if (action.type === "update_item") return `Update ${action.itemName}?`;
  return `Delete ${action.itemName}?`;
}

export function pendingActionDone(action: ToriPendingAction): string {
  if (action.type === "add_item") return `Added ${action.item.name}.`;
  if (action.type === "update_item") return `Updated ${action.itemName}.`;
  return `Deleted ${action.itemName}.`;
}

export function pendingActionConfirming(action: ToriPendingAction): string {
  if (action.type === "add_item") return "Adding...";
  if (action.type === "update_item") return "Updating...";
  return "Deleting...";
}

export function pendingActionDetails(action: ToriPendingAction): string[] {
  if (action.type === "add_item") {
    const { item } = action;
    const parts = [`Qty ${item.quantity}`];
    if (item.location) parts.push(item.location);
    if (item.expirationDate) parts.push(`Expires ${item.expirationDate}`);
    return [parts.join(", ")];
  }
  if (action.type === "update_item") {
    return Object.entries(action.patch)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : (value ?? "none")}`);
  }
  return [];
}

function toastForAction(action: ToriPendingAction): string {
  if (action.type === "add_item") return `Item “${action.item.name}” added`;
  if (action.type === "update_item") return `Item “${action.itemName}” updated`;
  return `Item “${action.itemName}” deleted`;
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
      const message = "Join a household to chat with Tori AI.";
      toastError(message);
      set({ threadError: message, sending: false });
      return;
    }

    try {
      const { reply, pendingAction } = await toriApi.chatStream(
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
            pendingAction,
            pendingStatus: pendingAction ? "idle" : undefined,
          },
        ],
        sending: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Tori AI could not reply. Try again.";
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
      toastError("Join a household to confirm this change.");
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
      toastError(err instanceof Error ? err.message : "Could not save that change.");
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
