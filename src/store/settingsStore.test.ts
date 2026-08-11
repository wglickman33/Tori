import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSettingsStore, parseTheme } from "./settingsStore";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    authApi: {
      ...actual.authApi,
      updateProfile: vi.fn().mockResolvedValue({
        id: "1",
        email: "a@b.com",
        displayName: "A",
        theme: "dark",
      }),
    },
    getAccessToken: vi.fn(() => "access"),
  };
});

describe("settingsStore", () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    useSettingsStore.setState({ theme: "auto", effectiveTheme: "light" });
    vi.clearAllMocks();
    const { getAccessToken } = await import("../api/client");
    vi.mocked(getAccessToken).mockReturnValue("access");
  });

  it("parseTheme falls back to auto for invalid values", () => {
    expect(parseTheme("dark")).toBe("dark");
    expect(parseTheme("neon")).toBe("auto");
  });

  it("setTheme updates preference and document attribute", () => {
    useSettingsStore.getState().setTheme("dark");
    expect(useSettingsStore.getState().theme).toBe("dark");
    expect(useSettingsStore.getState().effectiveTheme).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("applyFromServer accepts server theme", () => {
    useSettingsStore.getState().applyFromServer("light");
    expect(useSettingsStore.getState().theme).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("savePreferences PATCHes theme when signed in", async () => {
    const { authApi } = await import("../api/client");
    useSettingsStore.getState().setTheme("dark");
    await useSettingsStore.getState().savePreferences();
    expect(authApi.updateProfile).toHaveBeenCalledWith({ theme: "dark" });
  });

  it("savePreferences skips API when not signed in", async () => {
    const { authApi, getAccessToken } = await import("../api/client");
    vi.mocked(getAccessToken).mockReturnValue(null);
    await useSettingsStore.getState().savePreferences();
    expect(authApi.updateProfile).not.toHaveBeenCalled();
  });
});
