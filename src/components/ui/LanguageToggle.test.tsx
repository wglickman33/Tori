import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageToggle } from "./LanguageToggle";
import { useSettingsStore } from "../../store/settingsStore";
import i18n from "../../i18n";

describe("LanguageToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    useSettingsStore.setState({ language: "en" });
    void i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    useSettingsStore.setState({ language: "en" });
    await i18n.changeLanguage("en");
  });

  it("switches the document language to Spanish", async () => {
    render(<LanguageToggle />);
    fireEvent.click(screen.getByRole("button", { name: "Spanish" }));
    await waitFor(() => {
      expect(useSettingsStore.getState().language).toBe("es");
      expect(document.documentElement.lang).toBe("es");
    });
  });
});
