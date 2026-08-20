import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../store/settingsStore";
import type { Language } from "../../i18n/language";
import "./LanguageToggle.scss";

type LanguageToggleVariant = "header" | "compact";

interface LanguageToggleProps {
  variant?: LanguageToggleVariant;
}

export function LanguageToggle({ variant = "header" }: LanguageToggleProps) {
  const { t } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  return (
    <div
      className={`language-toggle language-toggle--${variant}`}
      role="group"
      aria-label={t("language.label")}
    >
      {(["en", "es"] as const).map((code) => (
        <button
          key={code}
          type="button"
          className={language === code ? "is-active" : ""}
          aria-pressed={language === code}
          aria-label={code === "en" ? t("language.english") : t("language.spanish")}
          onClick={() => setLanguage(code as Language)}
        >
          {t(`language.${code}`)}
        </button>
      ))}
    </div>
  );
}
