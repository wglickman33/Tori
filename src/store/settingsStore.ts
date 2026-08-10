import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, getAccessToken } from "../api/client";
import {
  applyEffectiveTheme,
  clearLegacyTheme,
  isThemePreference,
  readLegacyTheme,
  resolveEffectiveTheme,
  subscribeSystemTheme,
  type EffectiveTheme,
  type ThemePreference,
} from "../utils/theme";

export type Theme = ThemePreference;

export const SETTINGS_PERSIST_KEY = "tori-settings";

interface SettingsState {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  getEffectiveTheme: () => EffectiveTheme;
  savePreferences: () => Promise<void>;
  applyFromServer: (theme: string) => void;
}

const THEME_CYCLE: Theme[] = ["light", "dark", "auto"];

export function parseTheme(value: string): Theme {
  return isThemePreference(value) ? value : "auto";
}

function applyThemePreference(
  theme: Theme,
  set?: (partial: Partial<SettingsState>) => void
): EffectiveTheme {
  const effective = applyEffectiveTheme(theme);
  set?.({ effectiveTheme: effective });
  return effective;
}

let systemThemeUnsubscribe: (() => void) | null = null;

function clearSystemThemeSubscription(): void {
  systemThemeUnsubscribe?.();
  systemThemeUnsubscribe = null;
}

function ensureSystemThemeSubscription(get: () => SettingsState): void {
  clearSystemThemeSubscription();
  if (get().theme !== "auto") return;
  systemThemeUnsubscribe = subscribeSystemTheme(() => {
    const effective = applyEffectiveTheme("auto");
    useSettingsStore.setState({ effectiveTheme: effective });
  });
}

export function waitForSettingsHydration(): Promise<void> {
  return new Promise((resolve) => {
    if (useSettingsStore.persist.hasHydrated()) {
      resolve();
      return;
    }
    const unsub = useSettingsStore.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
    if (useSettingsStore.persist.hasHydrated()) {
      unsub();
      resolve();
    }
  });
}

export function hasPersistedSettings(): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(SETTINGS_PERSIST_KEY) != null;
}

export function initThemeSync(): () => void {
  const state = useSettingsStore.getState();
  applyThemePreference(state.theme, (partial) => useSettingsStore.setState(partial));
  ensureSystemThemeSubscription(() => useSettingsStore.getState());
  return () => {
    clearSystemThemeSubscription();
  };
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      theme: "auto",
      effectiveTheme: "light",

      getEffectiveTheme: () => resolveEffectiveTheme(get().theme),

      applyFromServer: (theme) => {
        const parsedTheme = parseTheme(theme);
        const effective = applyThemePreference(parsedTheme);
        ensureSystemThemeSubscription(get);
        set({ theme: parsedTheme, effectiveTheme: effective });
      },

      savePreferences: async () => {
        const { theme } = get();
        if (getAccessToken()) {
          await authApi.updateProfile({ theme });
        }
      },

      setTheme: (theme) => {
        const effective = applyThemePreference(theme);
        ensureSystemThemeSubscription(get);
        set({ theme, effectiveTheme: effective });
      },

      toggleTheme: () =>
        set((s) => {
          const currentIndex = THEME_CYCLE.indexOf(s.theme);
          const next = THEME_CYCLE[(currentIndex + 1) % THEME_CYCLE.length]!;
          const effective = applyThemePreference(next);
          ensureSystemThemeSubscription(get);
          return { theme: next, effectiveTheme: effective };
        }),
    }),
    {
      name: SETTINGS_PERSIST_KEY,
      partialize: (s) => ({ theme: s.theme }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<SettingsState>;
        const legacy = readLegacyTheme();
        const theme = isThemePreference(p.theme) ? p.theme : legacy ?? current.theme;
        if (legacy) clearLegacyTheme();
        return { ...current, ...p, theme };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const effective = applyThemePreference(state.theme);
        state.effectiveTheme = effective;
        ensureSystemThemeSubscription(() => useSettingsStore.getState());
      },
    }
  )
);
