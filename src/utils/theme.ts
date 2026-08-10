export type ThemePreference = "light" | "dark";

const KEY = "tori_theme";

export function readTheme(): ThemePreference {
  const raw = localStorage.getItem(KEY);
  return raw === "dark" ? "dark" : "light";
}

export function writeTheme(theme: ThemePreference): void {
  localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: ThemePreference = readTheme()): void {
  document.documentElement.setAttribute("data-theme", theme);
}
