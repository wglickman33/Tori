import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SettingsPage from "./SettingsPage";
import { useAuthStore } from "../store/authStore";
import { useHouseholdStore } from "../store/householdStore";
import { useSettingsStore } from "../store/settingsStore";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("../components/layout/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      updateProfile: vi.fn().mockResolvedValue({
        id: "u1",
        email: "owner@example.com",
        displayName: "Owner Updated",
        theme: "auto",
      }),
      deleteAccount: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock("../services/themeSync", () => ({
  syncThemeFromUser: vi.fn().mockResolvedValue(undefined),
}));

describe("SettingsPage", () => {
  beforeEach(async () => {
    localStorage.clear();
    navigateMock.mockReset();
    const { setTokens } = await import("../api/client");
    setTokens("access", "refresh");
    useAuthStore.setState({
      user: { id: "u1", email: "owner@example.com", displayName: "Owner" },
      isSignedIn: true,
      isLoading: false,
    });
    useHouseholdStore.setState({
      households: [],
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
    useSettingsStore.setState({ theme: "auto", language: "en", effectiveTheme: "light" });
  });

  afterEach(async () => {
    cleanup();
    vi.clearAllMocks();
    useSettingsStore.setState({ language: "en" });
    const i18n = (await import("../i18n")).default;
    await i18n.changeLanguage("en");
  });

  it("saves profile via updateProfile", async () => {
    const { authApi } = await import("../api/client");
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("Display name"), {
      target: { value: "Owner Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledWith({
        displayName: "Owner Updated",
        email: "owner@example.com",
      });
    });
    expect(screen.getByText("Profile saved.")).toBeTruthy();
  });

  it("blocks password change without current password", async () => {
    const { authApi } = await import("../api/client");
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "newpassword1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText("Current password is required to set a new password.")).toBeTruthy();
    expect(authApi.updateProfile).not.toHaveBeenCalled();
  });

  it("saves appearance theme", async () => {
    const { authApi } = await import("../api/client");
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Dark" }));
    fireEvent.click(screen.getByRole("button", { name: "Save appearance" }));

    await waitFor(() => {
      expect(authApi.updateProfile).toHaveBeenCalledWith({ theme: "dark", language: "en" });
    });
    expect(screen.getByText("Appearance saved to your account.")).toBeTruthy();
  });

  it("opens delete confirm and deletes on confirm", async () => {
    const { authApi } = await import("../api/client");
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
    expect(screen.getByRole("dialog", { name: "Delete account" })).toBeTruthy();
    expect(authApi.deleteAccount).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(authApi.deleteAccount).toHaveBeenCalled();
    });
    expect(navigateMock).toHaveBeenCalledWith("/login");
  });

  it("links to household management", () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Glickman Home · Owner · 1 member/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Manage household" }).getAttribute("href")).toBe(
      "/household"
    );
  });

  it("switches appearance language to Spanish", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Spanish" }));
    await waitFor(() => {
      expect(screen.getByText("Idioma")).toBeTruthy();
    });
    fireEvent.click(screen.getByRole("button", { name: "Inglés" }));
    await waitFor(() => {
      expect(screen.getByText("Language")).toBeTruthy();
    });
  });
});
