import { DarkModeSwitch } from "react-toggle-dark-mode";
import { useSettingsStore } from "../../store/settingsStore";
import "./ThemeToggle.scss";

type ThemeToggleVariant = "floating" | "header";

interface ThemeToggleProps {
  variant?: ThemeToggleVariant;
}

export function ThemeToggle({ variant = "floating" }: ThemeToggleProps) {
  const effectiveTheme = useSettingsStore((s) => s.effectiveTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const isDark = effectiveTheme === "dark";

  return (
    <div className={`theme-toggle theme-toggle--${variant}`}>
      <DarkModeSwitch
        checked={isDark}
        onChange={(checked) => setTheme(checked ? "dark" : "light")}
        size={variant === "header" ? 20 : 22}
        sunColor="#0000ab"
        moonColor="#dbdbff"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      />
    </div>
  );
}
