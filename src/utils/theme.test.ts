import { afterEach, describe, expect, it } from "vitest";
import { applyTheme, readTheme, writeTheme } from "./theme";

describe("theme preference", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("defaults to light and persists dark", () => {
    expect(readTheme()).toBe("light");
    writeTheme("dark");
    expect(readTheme()).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    applyTheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });
});
