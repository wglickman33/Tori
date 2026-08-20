import {
  hasPersistedSettings,
  useSettingsStore,
  waitForSettingsHydration,
} from "../store/settingsStore";

/** Align local theme and language with the signed-in account. */
export async function syncThemeFromUser(
  theme?: string | null,
  language?: string | null
): Promise<void> {
  if (!theme && !language) return;
  await waitForSettingsHydration();
  const settings = useSettingsStore.getState();

  const themeDiffers = Boolean(theme) && settings.theme !== theme;
  const languageDiffers = Boolean(language) && settings.language !== language;

  if (hasPersistedSettings() && (themeDiffers || languageDiffers)) {
    try {
      await settings.savePreferences();
      return;
    } catch {
      settings.applyFromServer(theme, language);
      return;
    }
  }

  settings.applyFromServer(theme, language);
}
