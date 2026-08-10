export type ThemePreference = "light" | "dark" | "auto";
export type EffectiveTheme = "light" | "dark";

const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";
const LEGACY_KEY = "tori_theme";

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "auto";
}

export function resolveEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  if (preference === "auto") {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return "light";
    }
    return window.matchMedia(SYSTEM_DARK_QUERY).matches ? "dark" : "light";
  }
  return preference;
}

export function applyEffectiveThemeToDom(effective: EffectiveTheme): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", effective);
}

export function applyEffectiveTheme(preference: ThemePreference): EffectiveTheme {
  const effective = resolveEffectiveTheme(preference);
  applyEffectiveThemeToDom(effective);
  return effective;
}

export function subscribeSystemTheme(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const media = window.matchMedia(SYSTEM_DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/** Migrate legacy `tori_theme` light/dark values into settings persist shape. */
export function readLegacyTheme(): ThemePreference | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(LEGACY_KEY);
  if (raw === "light" || raw === "dark") return raw;
  return null;
}

export function clearLegacyTheme(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(LEGACY_KEY);
}
