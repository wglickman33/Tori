import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import es from "./es.json";
import { dateLocale, parseLanguage, type Language } from "./language";

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    es: { translation: es },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function applyLanguage(language: Language): void {
  const next = parseLanguage(language);
  if (i18n.language !== next) {
    void i18n.changeLanguage(next);
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = next;
    document.title = i18n.t("app.title");
  }
}

export function currentLanguage(): Language {
  const lng = (i18n.resolvedLanguage ?? i18n.language ?? "en").toLowerCase();
  return lng.startsWith("es") ? "es" : "en";
}

export function currentDateLocale(): string {
  return dateLocale(currentLanguage());
}

export default i18n;
