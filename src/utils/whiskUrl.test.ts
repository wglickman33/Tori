import { afterEach, describe, expect, it, vi } from "vitest";
import { getWhiskUrl } from "./whiskUrl";

describe("getWhiskUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses VITE_WHISK_URL when set", () => {
    vi.stubEnv("VITE_WHISK_URL", "https://example.com/whisk");
    expect(getWhiskUrl()).toBe("https://example.com/whisk");
  });

  it("falls back when env is empty", () => {
    vi.stubEnv("VITE_WHISK_URL", "");
    expect(getWhiskUrl()).toBe("https://trywhisk.netlify.app");
  });
});
