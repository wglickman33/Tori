import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import "./ChromeToggles.scss";

type ChromeTogglesVariant = "floating" | "header" | "compact";

interface ChromeTogglesProps {
  variant?: ChromeTogglesVariant;
}

export function ChromeToggles({ variant = "header" }: ChromeTogglesProps) {
  const languageVariant = variant === "compact" ? "compact" : "header";

  return (
    <div className={`chrome-toggles chrome-toggles--${variant}`}>
      <LanguageToggle variant={languageVariant} />
      <ThemeToggle variant="header" />
    </div>
  );
}
