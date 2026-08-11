import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "./authStore";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      logout: vi.fn().mockResolvedValue(undefined),
      me: vi.fn(),
      updateProfile: vi.fn(),
      deleteAccount: vi.fn().mockResolvedValue(undefined),
    },
  };
});

vi.mock("../services/themeSync", () => ({
  syncThemeFromUser: vi.fn().mockResolvedValue(undefined),
}));

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      isSignedIn: false,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  it("stores session tokens on sign in", () => {
    useAuthStore.getState().signIn(
      { id: "1", email: "a@b.com", displayName: "A" },
      "access",
      "refresh"
    );
    expect(localStorage.getItem("tori_access_token")).toBe("access");
    expect(localStorage.getItem("tori_refresh_token")).toBe("refresh");
    expect(useAuthStore.getState().isSignedIn).toBe(true);
  });

  it("signOut clears session and calls logout API", async () => {
    const { authApi } = await import("../api/client");
    useAuthStore.getState().signIn(
      { id: "1", email: "a@b.com", displayName: "A" },
      "access",
      "refresh"
    );

    await useAuthStore.getState().signOut();

    expect(authApi.logout).toHaveBeenCalledWith("refresh");
    expect(localStorage.getItem("tori_access_token")).toBeNull();
    expect(localStorage.getItem("tori_refresh_token")).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isSignedIn).toBe(false);
  });

  it("bootstrap loads me when access token exists", async () => {
    const { authApi, setTokens } = await import("../api/client");
    setTokens("access", "refresh");
    vi.mocked(authApi.me).mockResolvedValue({
      id: "1",
      email: "a@b.com",
      displayName: "A",
    });

    await useAuthStore.getState().bootstrap();

    expect(authApi.me).toHaveBeenCalled();
    expect(useAuthStore.getState().user?.email).toBe("a@b.com");
    expect(useAuthStore.getState().isSignedIn).toBe(true);
  });

  it("updateProfile updates cached user", async () => {
    const { authApi, setTokens } = await import("../api/client");
    setTokens("access", "refresh");
    useAuthStore.setState({
      user: { id: "1", email: "a@b.com", displayName: "A" },
      isSignedIn: true,
      isLoading: false,
    });
    vi.mocked(authApi.updateProfile).mockResolvedValue({
      id: "1",
      email: "new@b.com",
      displayName: "Updated",
      theme: "dark",
    });

    const user = await useAuthStore.getState().updateProfile({
      displayName: "Updated",
      email: "new@b.com",
    });

    expect(authApi.updateProfile).toHaveBeenCalledWith({
      displayName: "Updated",
      email: "new@b.com",
    });
    expect(user.displayName).toBe("Updated");
    expect(useAuthStore.getState().user?.email).toBe("new@b.com");
  });

  it("deleteAccount clears session", async () => {
    const { authApi, setTokens } = await import("../api/client");
    setTokens("access", "refresh");
    useAuthStore.setState({
      user: { id: "1", email: "a@b.com", displayName: "A" },
      isSignedIn: true,
      isLoading: false,
    });

    await useAuthStore.getState().deleteAccount();

    expect(authApi.deleteAccount).toHaveBeenCalled();
    expect(localStorage.getItem("tori_access_token")).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().isSignedIn).toBe(false);
  });
});
