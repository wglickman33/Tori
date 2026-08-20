import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ToriAiPage from "./ToriAiPage";
import type { ToriStreamEvent } from "../api/client";
import { useToriStore } from "../store/toriStore";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";

const chatStream = vi.fn();
const listFolders = vi.fn();
const listItems = vi.fn();
const createItem = vi.fn();
const updateItem = vi.fn();
const deleteItem = vi.fn();
const toastError = vi.fn();
const toastSuccess = vi.fn();

vi.mock("../components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    toriApi: {
      chatStream: (...args: unknown[]) => chatStream(...args),
    },
    inventoryApi: {
      ...actual.inventoryApi,
      listFolders: (...args: unknown[]) => listFolders(...args),
      listItems: (...args: unknown[]) => listItems(...args),
      createItem: (...args: unknown[]) => createItem(...args),
      updateItem: (...args: unknown[]) => updateItem(...args),
      deleteItem: (...args: unknown[]) => deleteItem(...args),
    },
  };
});

vi.mock("../store/toastStore", () => ({
  toastError: (...args: unknown[]) => toastError(...args),
  toastSuccess: (...args: unknown[]) => toastSuccess(...args),
}));

const pendingMilk = {
  type: "add_item" as const,
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
};

function renderPage() {
  return render(
    <MemoryRouter>
      <ToriAiPage />
    </MemoryRouter>
  );
}

async function mockStream(events: ToriStreamEvent[], reply: string, extra?: object) {
  chatStream.mockImplementation(
    async (
      _messages: unknown,
      _householdId: unknown,
      onEvent?: (event: ToriStreamEvent) => void
    ) => {
      for (const event of events) onEvent?.(event);
      return { reply, ...extra };
    }
  );
}

afterEach(() => {
  cleanup();
  chatStream.mockReset();
  listFolders.mockReset();
  listItems.mockReset();
  createItem.mockReset();
  updateItem.mockReset();
  deleteItem.mockReset();
  toastError.mockReset();
  toastSuccess.mockReset();
  useToriStore.getState().resetChat();
  useToriStore.getState().closeWidget();
  useHouseholdStore.setState({ household: null, households: [] });
  useInventoryStore.getState().clear();
});

describe("ToriAiPage", () => {
  const householdId = "h1";

  beforeEach(() => {
    useHouseholdStore.setState({
      household: {
        id: householdId,
        name: "Glickman Home",
        inviteCode: "CODE",
        role: "owner",
        ownerId: "u1",
        memberCount: 1,
        locationPresets: ["Fridge"],
      },
    });
    listFolders.mockResolvedValue({ folders: [] });
    listItems.mockResolvedValue({ items: [] });
  });

  it("sends a message and shows the reply", async () => {
    await mockStream(
      [{ type: "reply", reply: "General advice: keep milk cold." }],
      "General advice: keep milk cold."
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "How should I store milk?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("General advice: keep milk cold.")).toBeTruthy();
    });
    expect(chatStream).toHaveBeenCalledWith(
      [{ role: "user", content: "How should I store milk?" }],
      householdId,
      expect.any(Function)
    );
  });

  it("sends a suggested prompt", async () => {
    await mockStream(
      [{ type: "reply", reply: "I cannot look that up yet." }],
      "I cannot look that up yet."
    );
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: /what's expiring this week/i }));

    await waitFor(() => {
      expect(screen.getByText("I cannot look that up yet.")).toBeTruthy();
    });
    expect(chatStream).toHaveBeenCalledWith(
      [{ role: "user", content: "What's expiring this week?" }],
      householdId,
      expect.any(Function)
    );
  });

  it("disables send while a reply is pending", () => {
    chatStream.mockImplementation(() => new Promise(() => {}));
    renderPage();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(screen.getByRole("button", { name: /sending/i })).toHaveProperty("disabled", true);
    expect(screen.getByText(/looking that up/i)).toBeTruthy();
    expect(screen.getByText(/starting lookup/i)).toBeTruthy();
    expect(chatStream).toHaveBeenCalledTimes(1);
  });

  it("shows live lookup steps before the reply arrives", async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    chatStream.mockImplementation(
      async (
        _messages: unknown,
        _householdId: unknown,
        onEvent?: (event: ToriStreamEvent) => void
      ) => {
        onEvent?.({
          type: "tool.start",
          id: "call_1",
          name: "search_items",
          input: { query: "milk" },
        });
        await gate;
        onEvent?.({
          type: "tool.result",
          id: "call_1",
          name: "search_items",
          input: { query: "milk" },
          output: { count: 1, items: [{ name: "Milk" }] },
        });
        return { reply: "Milk is in the fridge." };
      }
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Do we have milk?" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("Searching inventory")).toBeTruthy();
      expect(screen.getByText("Working...")).toBeTruthy();
    });

    release();

    await waitFor(() => {
      expect(screen.getByText("Found 1 item")).toBeTruthy();
      expect(screen.getByText("Milk is in the fridge.")).toBeTruthy();
    });
  });

  it("shows a clear error when Tori AI cannot reply", async () => {
    chatStream.mockRejectedValue(new Error("Tori AI is busy right now. Try again in a moment."));
    renderPage();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toMatch(/busy right now/i);
    });
    expect(toastError).toHaveBeenCalled();
    expect(screen.getByLabelText(/message/i)).toHaveProperty("value", "Hello");
  });

  it("clears the conversation and returns to the empty state", async () => {
    await mockStream(
      [{ type: "reply", reply: "General advice: keep milk cold." }],
      "General advice: keep milk cold."
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "How should I store milk?" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText("General advice: keep milk cold.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /clear chat/i }));

    expect(screen.queryByText("General advice: keep milk cold.")).toBeNull();
    expect(screen.queryByRole("button", { name: /clear chat/i })).toBeNull();
    expect(screen.getByText(/what can i help with/i)).toBeTruthy();
    expect(screen.getByText(/inventory lookups will show up here/i)).toBeTruthy();
  });

  it("asks before adding an item and only writes on confirm", async () => {
    await mockStream(
      [{ type: "reply", reply: "You do not have milk. Want me to add it to the fridge?" }],
      "You do not have milk. Want me to add it to the fridge?",
      { pendingAction: pendingMilk }
    );
    createItem.mockResolvedValue({
      item: {
        id: "i-milk",
        householdId,
        folderId: null,
        name: "Milk",
        location: "Fridge",
        purchaseDate: null,
        expirationDate: null,
        quantity: 1,
        price: null,
        tags: [],
        imageUrl: null,
      },
    });
    renderPage();

    fireEvent.change(screen.getByLabelText(/message/i), {
      target: { value: "Add milk to the fridge if we don't have it" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByText(/add milk\?/i)).toBeTruthy();
    });
    expect(createItem).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /^confirm$/i }));

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(householdId, {
        name: "Milk",
        quantity: 1,
        location: "Fridge",
        folderId: null,
        expirationDate: null,
        purchaseDate: null,
        tags: [],
        price: null,
      });
      expect(screen.getByText(/added milk/i)).toBeTruthy();
      expect(screen.getByRole("link", { name: /view inventory/i }).getAttribute("href")).toBe(
        "/inventory"
      );
    });
    expect(toastSuccess).toHaveBeenCalled();
  });

  it("does not write when the user dismisses a proposed add", async () => {
    await mockStream(
      [{ type: "reply", reply: "Want me to add milk to the fridge?" }],
      "Want me to add milk to the fridge?",
      { pendingAction: pendingMilk }
    );
    renderPage();

    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: "Add milk" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /not now/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: /not now/i }));

    expect(screen.queryByRole("button", { name: /^confirm$/i })).toBeNull();
    expect(createItem).not.toHaveBeenCalled();
  });
});
