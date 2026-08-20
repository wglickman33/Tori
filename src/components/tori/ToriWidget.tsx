import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useHouseholdStore } from "../../store/householdStore";
import { useToriStore } from "../../store/toriStore";
import { IconToriAi } from "../ui/SidebarIcons";
import { ToriChatPane } from "./ToriChatPane";
import "./ToriWidget.scss";

export function ToriWidget() {
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
            <h2 id="tori-widget-title">Tori AI</h2>
            <p>Household assistant</p>
          </div>
        </div>
        <button type="button" className="tori-widget__close" onClick={closeWidget} aria-label="Close Tori AI">
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
          <p>Join a household to chat with Tori AI.</p>
          <p>Inventory, expiry, and locations stay private to your household.</p>
          <Link to="/onboarding" className="tori-widget__cta" onClick={closeWidget}>
            Set up household
          </Link>
        </div>
      )}

      <footer className="tori-widget__footer">
        <Link to="/ai" className="tori-widget__full" onClick={closeWidget}>
          Open full view
        </Link>
      </footer>
    </section>
  );
}
