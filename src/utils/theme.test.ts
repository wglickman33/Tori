import { afterEach, describe, expect, it, vi } from "vitest";
import {
  applyEffectiveTheme,
  isThemePreference,
  resolveEffectiveTheme,
  type ThemePreference,
} from "./theme";

describe("theme preference", () => {
  afterEach(() => {
    document.documentElement.removeAttribute("data-theme");
    vi.unstubAllGlobals();
  });

  it("accepts light, dark, and auto", () => {
    expect(isThemePreference("light")).toBe(true);
    expect(isThemePreference("dark")).toBe(true);
    expect(isThemePreference("auto")).toBe(true);
    expect(isThemePreference("neon")).toBe(false);
  });

  it("resolves auto from system preference", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query.includes("dark"),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    );
    expect(resolveEffectiveTheme("auto")).toBe("dark");
    expect(resolveEffectiveTheme("light")).toBe("light");
  });

  it("applies effective theme to the document", () => {
    applyEffectiveTheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    applyEffectiveTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("keeps explicit preferences unchanged", () => {
    const prefs: ThemePreference[] = ["light", "dark"];
    for (const pref of prefs) {
      expect(resolveEffectiveTheme(pref)).toBe(pref);
    }
  });
});
