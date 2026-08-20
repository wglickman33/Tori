import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { HouseholdCreateCard } from "../components/onboarding/HouseholdCreateCard";
import { HouseholdJoinCard } from "../components/onboarding/HouseholdJoinCard";
import { OnboardingHouseholdsPanel } from "../components/onboarding/OnboardingHouseholdsPanel";
import { ChromeToggles } from "../components/ui/ChromeToggles";
import logo from "../assets/logos/website-logo.png";
import { useHouseholdStore } from "../store/householdStore";
import "./OnboardingPage.scss";

export default function OnboardingPage() {
  const { t } = useTranslation();
  const households = useHouseholdStore((s) => s.households);
  const fetchMine = useHouseholdStore((s) => s.fetchMine);
  const hasHouseholds = households.length > 0;

  useEffect(() => {
    void fetchMine();
  }, [fetchMine]);

  return (
    <div className="onboarding-page">
      <ChromeToggles variant="floating" />

      <div className="onboarding-page__inner">
        <header className="onboarding-page__header">
          <div className="onboarding-page__logo-wrap">
            <img src={logo} alt="" className="onboarding-page__logo" />
          </div>
          <p className="onboarding-page__brand">{t("app.name")}</p>
          <h1 className="onboarding-page__title">
            {hasHouseholds ? t("onboarding.addTitle") : t("onboarding.setupTitle")}
          </h1>
          <p className="onboarding-page__subtitle">
            {hasHouseholds ? t("onboarding.addCopy") : t("onboarding.setupCopy")}
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
