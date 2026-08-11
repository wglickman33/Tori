import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HouseholdPage from "./HouseholdPage";
import { useAuthStore } from "../store/authStore";
import { useHouseholdStore } from "../store/householdStore";

vi.mock("../components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    householdsApi: {
      ...actual.householdsApi,
      listMembers: vi.fn().mockResolvedValue({
        members: [
          {
            userId: "u1",
            displayName: "Owner",
            email: "owner@example.com",
            role: "owner",
            joinedAt: "2026-01-01",
          },
        ],
      }),
      leave: vi.fn().mockResolvedValue(undefined),
      update: vi.fn(),
      regenerateCode: vi.fn(),
    },
    authApi: {
      ...actual.authApi,
      logout: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock("../services/themeSync", () => ({
  syncThemeFromUser: vi.fn().mockResolvedValue(undefined),
}));

describe("HouseholdPage leave confirm", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: { id: "u1", email: "owner@example.com", displayName: "Owner" },
      isSignedIn: true,
      isLoading: false,
    });
    useHouseholdStore.setState({
      households: [
        {
          id: "h1",
          name: "Glickman Home",
          inviteCode: "G5W53ZB7",
          role: "owner",
          ownerId: "u1",
          memberCount: 1,
          locationPresets: ["Pantry"],
        },
      ],
      household: {
        id: "h1",
        name: "Glickman Home",
        inviteCode: "G5W53ZB7",
        role: "owner",
        ownerId: "u1",
        memberCount: 1,
        locationPresets: ["Pantry"],
      },
      members: [],
      isLoading: false,
      hasLoadedMine: true,
      error: null,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens confirm modal before leave/dissolve and only leaves on confirm", async () => {
    const { householdsApi } = await import("../api/client");
    render(
      <MemoryRouter>
        <HouseholdPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Leave / dissolve" }));
    expect(screen.getByRole("dialog", { name: "Leave household" })).toBeTruthy();
    expect(householdsApi.leave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Leave" }));

    await waitFor(() => {
      expect(householdsApi.leave).toHaveBeenCalledWith("h1");
    });
  });
});
