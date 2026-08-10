import { DarkModeSwitch } from "react-toggle-dark-mode";
import { HouseholdCreateCard } from "../components/onboarding/HouseholdCreateCard";
import { HouseholdJoinCard } from "../components/onboarding/HouseholdJoinCard";
import logo from "../assets/logos/website-logo.png";
import { useSettingsStore } from "../store/settingsStore";
import "./OnboardingPage.scss";

export default function OnboardingPage() {
  const effectiveTheme = useSettingsStore((s) => s.effectiveTheme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const isDark = effectiveTheme === "dark";

  return (
    <div className="onboarding-page">
      <div className="onboarding-page__theme">
        <DarkModeSwitch
          checked={isDark}
          onChange={(checked) => setTheme(checked ? "dark" : "light")}
          size={22}
          sunColor="#0000ab"
          moonColor="#dbdbff"
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        />
      </div>

      <div className="onboarding-page__inner">
        <header className="onboarding-page__header">
          <div className="onboarding-page__logo-wrap">
            <img src={logo} alt="" className="onboarding-page__logo" />
          </div>
          <p className="onboarding-page__brand">Tori</p>
          <h1 className="onboarding-page__title">Set up your household</h1>
          <p className="onboarding-page__subtitle">
            Create a shared home inventory, or join one with an invite code.
          </p>
        </header>

        <div className="onboarding-page__grid">
          <HouseholdCreateCard />
          <HouseholdJoinCard />
        </div>
      </div>
    </div>
  );
}
