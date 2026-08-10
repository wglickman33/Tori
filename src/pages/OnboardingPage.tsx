import { HouseholdCreateCard } from "../components/onboarding/HouseholdCreateCard";
import { HouseholdJoinCard } from "../components/onboarding/HouseholdJoinCard";
import logo from "../assets/logos/tori-logo.svg";
import "./OnboardingPage.scss";

export default function OnboardingPage() {
  return (
    <div className="onboarding-page">
      <header className="onboarding-page__header">
        <img src={logo} alt="Tori" className="onboarding-page__logo" />
        <h1 className="onboarding-page__title">Set up your household</h1>
        <p className="onboarding-page__subtitle">
          Inventory is shared with everyone in your household.
        </p>
      </header>
      <div className="onboarding-page__grid">
        <HouseholdCreateCard />
        <HouseholdJoinCard />
      </div>
    </div>
  );
}
