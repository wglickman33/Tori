import {
  hasPersistedSettings,
  useSettingsStore,
  waitForSettingsHydration,
} from "../store/settingsStore";

/** Align local theme with the signed-in account, Whisk-style. */
export async function syncThemeFromUser(theme?: string | null): Promise<void> {
  if (!theme) return;
  await waitForSettingsHydration();
  const settings = useSettingsStore.getState();

  if (hasPersistedSettings() && settings.theme !== theme) {
    try {
      await settings.savePreferences();
      return;
    } catch {
      settings.applyFromServer(theme);
      return;
    }
  }

  settings.applyFromServer(theme);
}
