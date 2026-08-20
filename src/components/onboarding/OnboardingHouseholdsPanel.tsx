import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHouseholdStore } from "../../store/householdStore";
import { useInventoryStore } from "../../store/inventoryStore";
import { Button } from "../ui/Button";
import "./OnboardingHouseholdsPanel.scss";

export function OnboardingHouseholdsPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const households = useHouseholdStore((s) => s.households);
  const activeId = useHouseholdStore((s) => s.household?.id);
  const selectHousehold = useHouseholdStore((s) => s.selectHousehold);
  const clearInventory = useInventoryStore((s) => s.clear);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (households.length === 0) return null;

  const selected = households.find((h) => h.id === selectedId) ?? null;

  const toggleSelect = (id: string) => {
    setSelectedId((current) => (current === id ? null : id));
  };

  const continueToHousehold = () => {
    if (!selected) return;
    if (selected.id !== activeId) {
      clearInventory();
      selectHousehold(selected.id);
    }
    navigate("/inventory");
  };

  return (
    <section className="onboarding-households" aria-label={t("onboarding.yourHouseholds")}>
      <div className="onboarding-households__intro">
        <p className="onboarding-households__eyebrow">{t("onboarding.alreadySetUp")}</p>
        <h2 className="onboarding-households__title">{t("onboarding.yourHouseholds")}</h2>
        <p className="onboarding-households__copy">{t("onboarding.panelCopy")}</p>
      </div>
      <ul className="onboarding-households__list" role="listbox" aria-label={t("onboarding.householdsList")}>
        {households.map((h) => {
          const isSelected = h.id === selectedId;
          return (
            <li key={h.id}>
              <button
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`onboarding-households__item${isSelected ? " is-selected" : ""}`}
                onClick={() => toggleSelect(h.id)}
              >
                <span className="onboarding-households__item-text">
                  <span className="onboarding-households__name">{h.name}</span>
                  <span className="onboarding-households__meta">
                    {h.role === "owner" ? t("common.owner") : t("common.member")}
                    {typeof h.memberCount === "number"
                      ? ` · ${t("settings.member", { count: h.memberCount })}`
                      : ""}
                  </span>
                </span>
                <span className="onboarding-households__check" aria-hidden>
                  {isSelected ? t("onboarding.selected") : t("onboarding.select")}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <Button
        type="button"
        className="onboarding-households__primary"
        disabled={!selected}
        onClick={continueToHousehold}
      >
        {selected ? t("onboarding.continueTo", { name: selected.name }) : t("onboarding.pleaseSelect")}
      </Button>
    </section>
  );
}
