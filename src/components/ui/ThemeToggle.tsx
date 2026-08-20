import { DarkModeSwitch } from "react-toggle-dark-mode";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../../store/settingsStore";
import "./ThemeToggle.scss";

type ThemeToggleVariant = "floating" | "header";

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
}

export function ThemeToggle({ variant = "header" }: ThemeToggleProps) {
  const { t } = useTranslation();
  const effectiveTheme = useSettingsStore((s) => s.effectiveTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const isDark = effectiveTheme === "dark";

  return (
    <div className={`theme-toggle theme-toggle--${variant}`}>
      <DarkModeSwitch
        checked={isDark}
        onChange={(checked) => setTheme(checked ? "dark" : "light")}
        size={20}
        sunColor="#25275a"
        moonColor="#dbdbff"
        aria-label={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      />
    </div>
  );
}
