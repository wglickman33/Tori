import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useHouseholdStore } from "../../store/householdStore";
import { useToriStore } from "../../store/toriStore";
import { IconToriAi } from "../ui/SidebarIcons";
import { ToriChatPane } from "./ToriChatPane";
import "./ToriWidget.scss";

export function ToriWidget() {
  const { t } = useTranslation();
  const location = useLocation();
  const widgetOpen = useToriStore((s) => s.widgetOpen);
  const closeWidget = useToriStore((s) => s.closeWidget);
  const household = useHouseholdStore((s) => s.household);
  const onToriPage = location.pathname === "/ai";

  useEffect(() => {
    if (!widgetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeWidget();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [widgetOpen, closeWidget]);

  if (!widgetOpen || onToriPage) return null;

  return (
    <section className="tori-widget" role="dialog" aria-labelledby="tori-widget-title">
      <header className="tori-widget__header">
        <div className="tori-widget__brand">
          <span className="tori-widget__icon" aria-hidden>
            <IconToriAi />
          </span>
          <div>
            <h2 id="tori-widget-title">{t("ai.title")}</h2>
            <p>{t("ai.householdAssistant")}</p>
          </div>
        </div>
        <button type="button" className="tori-widget__close" onClick={closeWidget} aria-label={t("ai.close")}>
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
            <path
              d="M6 6l12 12M18 6L6 18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>

      {household ? (
        <ToriChatPane variant="widget" inputId="tori-widget-message" />
      ) : (
        <div className="tori-widget__guest">
          <p>{t("ai.joinToChat")}</p>
          <p>{t("ai.privacy")}</p>
          <Link to="/onboarding" className="tori-widget__cta" onClick={closeWidget}>
            {t("ai.setUpHousehold")}
          </Link>
        </div>
      )}

      <footer className="tori-widget__footer">
        <Link to="/ai" className="tori-widget__full" onClick={closeWidget}>
          {t("ai.openFullView")}
        </Link>
      </footer>
    </section>
  );
}
