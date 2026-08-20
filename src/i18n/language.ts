export const LANGUAGES = ["en", "es"] as const;

export type Language = (typeof LANGUAGES)[number];

export function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "es";
}

export function parseLanguage(value: unknown): Language {
  return isLanguage(value) ? value : "en";
}

export function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
}

export function dateLocale(language: Language): string {
  return language === "es" ? "es-US" : "en-US";
}

export function speechLocale(language: Language): string {
  return language === "es" ? "es-US" : "en-US";
}
