import { useEffect } from "react";
import { HouseholdCreateCard } from "../components/onboarding/HouseholdCreateCard";
import { HouseholdJoinCard } from "../components/onboarding/HouseholdJoinCard";
import { OnboardingHouseholdsPanel } from "../components/onboarding/OnboardingHouseholdsPanel";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import logo from "../assets/logos/website-logo.png";
import { useHouseholdStore } from "../store/householdStore";
import "./OnboardingPage.scss";

export default function OnboardingPage() {
  const households = useHouseholdStore((s) => s.households);
  const fetchMine = useHouseholdStore((s) => s.fetchMine);
  const hasHouseholds = households.length > 0;

  useEffect(() => {
    void fetchMine();
  }, [fetchMine]);

  return (
    <div className="onboarding-page">
      <ThemeToggle />

      <div className="onboarding-page__inner">
        <header className="onboarding-page__header">
          <div className="onboarding-page__logo-wrap">
            <img src={logo} alt="" className="onboarding-page__logo" />
          </div>
          <p className="onboarding-page__brand">Tori</p>
          <h1 className="onboarding-page__title">
            {hasHouseholds ? "Add another household" : "Set up your household"}
          </h1>
          <p className="onboarding-page__subtitle">
            {hasHouseholds
              ? "Open one you already belong to, or create/join another."
              : "Create a shared home inventory, or join one with an invite code."}
          </p>
        </header>

        <div className="onboarding-page__grid">
          <OnboardingHouseholdsPanel />
          <HouseholdCreateCard />
          <HouseholdJoinCard />
        </div>
      </div>
    </div>
  );
}
