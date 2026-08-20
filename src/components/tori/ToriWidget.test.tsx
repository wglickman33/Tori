import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ToriWidget } from "./ToriWidget";
import { FloatingAppsMenu } from "../ui/FloatingAppsMenu";
import { NotificationToastContainer } from "../ui/NotificationToast";
import { useToriStore } from "../../store/toriStore";
import { useHouseholdStore } from "../../store/householdStore";
import { useToastStore } from "../../store/toastStore";
import type { ToriStreamEvent } from "../../api/client";

const chatStream = vi.fn();

vi.mock("../../api/client", async () => {
  const actual = await vi.importActual<typeof import("../../api/client")>("../../api/client");
  return {
    ...actual,
    toriApi: {
      chatStream: (...args: unknown[]) => chatStream(...args),
    },
  };
});

function setHousehold() {
  useHouseholdStore.setState({
    household: {
      id: "h1",
      name: "Glickman Home",
      inviteCode: "CODE",
      role: "owner",
      ownerId: "u1",
      memberCount: 1,
      locationPresets: ["Fridge"],
    },
  });
}

function renderWidget(path = "/inventory") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/inventory" element={<p>Inventory page</p>} />
        <Route path="/ai" element={<p>Full Tori AI page</p>} />
        <Route path="/onboarding" element={<p>Onboarding page</p>} />
      </Routes>
      <NotificationToastContainer />
      <FloatingAppsMenu />
      <ToriWidget />
    </MemoryRouter>
  );
}

async function mockStream(reply: string, events: ToriStreamEvent[] = [{ type: "reply", reply }]) {
  chatStream.mockImplementation(
    async (_messages: unknown, _householdId: unknown, onEvent?: (event: ToriStreamEvent) => void) => {
      for (const event of events) onEvent?.(event);
      return { reply };
    }
  );
}

afterEach(() => {
  cleanup();
  chatStream.mockReset();
  useToriStore.getState().resetChat();
  useToriStore.getState().closeWidget();
  useHouseholdStore.setState({ household: null, households: [] });
  useToastStore.setState({ items: [] });
});

describe("ToriWidget", () => {
  it("stays closed until opened", () => {
    setHousehold();
    renderWidget();
    expect(screen.queryByRole("dialog", { name: /tori ai/i })).toBeNull();
  });

  it("opens from the apps bubble without leaving the current page", () => {
    setHousehold();
    renderWidget();
    fireEvent.click(screen.getByLabelText(/open apps menu/i));
    fireEvent.click(screen.getByRole("button", { name: /open tori ai/i }));

    expect(screen.getByText("Inventory page")).toBeTruthy();
    expect(screen.queryByText("Full Tori AI page")).toBeNull();
    expect(screen.getByRole("dialog", { name: /tori ai/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /open full view/i }).getAttribute("href")).toBe("/ai");
  });

  it("hides on the full Tori AI page", () => {
    setHousehold();
    useToriStore.getState().openWidget();
    renderWidget("/ai");
    expect(screen.queryByRole("dialog", { name: /tori ai/i })).toBeNull();
    expect(screen.getByText("Full Tori AI page")).toBeTruthy();
  });

  it("explains the widget is for other pages and can open it on Inventory", () => {
    setHousehold();
    renderWidget("/ai");
    fireEvent.click(screen.getByLabelText(/open apps menu/i));
    fireEvent.click(screen.getByRole("button", { name: /open tori ai/i }));

    expect(screen.getByText(/already in the full tori ai view/i)).toBeTruthy();
    expect(screen.queryByRole("dialog", { name: /tori ai/i })).toBeNull();

    fireEvent.click(screen.getByRole("link", { name: /use widget on inventory/i }));

    expect(screen.getByText("Inventory page")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: /tori ai/i })).toBeTruthy();
  });

  it("asks users without a household to join one", () => {
    useToriStore.getState().openWidget();
    renderWidget();
    expect(screen.getByText(/join a household to chat with tori ai/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("link", { name: /set up household/i }));
    expect(screen.getByText("Onboarding page")).toBeTruthy();
    expect(screen.queryByLabelText(/message/i)).toBeNull();
  });

  it("sends a suggested prompt from the widget", async () => {
    setHousehold();
    await mockStream("Milk is in the fridge.");
    useToriStore.getState().openWidget();
    renderWidget();

    fireEvent.click(screen.getByRole("button", { name: /what's expiring this week/i }));

    await waitFor(() => {
      expect(screen.getByText("Milk is in the fridge.")).toBeTruthy();
    });
    expect(screen.queryByText("Inventory page")).toBeTruthy();
  });

  it("closes from the header button", () => {
    setHousehold();
    useToriStore.getState().openWidget();
    renderWidget();
    fireEvent.click(screen.getByRole("button", { name: /close tori ai/i }));
    expect(screen.queryByRole("dialog", { name: /tori ai/i })).toBeNull();
  });

  it("clears chat from the widget", async () => {
    setHousehold();
    await mockStream("Milk is in the fridge.");
    useToriStore.getState().openWidget();
    renderWidget();

    fireEvent.click(screen.getByRole("button", { name: /what's expiring this week/i }));

    await waitFor(() => {
      expect(screen.getByText("Milk is in the fridge.")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /clear chat/i }));

    expect(screen.queryByText("Milk is in the fridge.")).toBeNull();
    expect(screen.getByText(/what can i help with/i)).toBeTruthy();
  });
});
