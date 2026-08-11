import { useEffect, useId, useRef, useState } from "react";
import whiskLogo from "../../assets/logos/whiskLogoAmber.svg";
import logo from "../../assets/logos/website-logo.png";
import { getWhiskUrl } from "../../utils/whiskUrl";
import "./FloatingAppsMenu.scss";

function FabPlusIcon() {
  return (
    <svg className="floating-apps__fab-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FabCloseIcon() {
  return (
    <svg className="floating-apps__fab-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function FloatingAppsMenu() {
  const whiskHref = getWhiskUrl();
  const togglerId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"none" | "whisk" | "tori">("none");

  useEffect(() => {
    if (!open && panel === "none") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanel("none");
        setOpen(false);
      }
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setPanel("none");
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open, panel]);

  const closeAll = () => {
    setPanel("none");
    setOpen(false);
  };

  return (
    <nav
      ref={rootRef}
      className={`floating-apps${open ? " is-open" : ""}${panel !== "none" ? " has-panel" : ""}`}
      aria-label="Apps"
    >
      {panel === "whisk" ? (
        <aside className="floating-apps__panel" aria-label="Whisk">
          <div className="floating-apps__panel-top">
            <div className="floating-apps__panel-brand">
              <img src={whiskLogo} alt="" className="floating-apps__panel-logo" />
              <div>
                <p className="floating-apps__panel-eyebrow">Also from us</p>
                <p className="floating-apps__panel-title">Whisk</p>
              </div>
            </div>
            <button type="button" className="floating-apps__panel-close" onClick={closeAll} aria-label="Close">
              <FabCloseIcon />
            </button>
          </div>
          <p className="floating-apps__panel-body">
            Recipes and shopping lists for your kitchen, a sibling app to Tori.
          </p>
          <a
            className="floating-apps__panel-cta floating-apps__panel-cta--whisk"
            href={whiskHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeAll}
          >
            Open Whisk
          </a>
        </aside>
      ) : null}

      {panel === "tori" ? (
        <aside className="floating-apps__panel" aria-label="Tori AI">
          <div className="floating-apps__panel-top">
            <div className="floating-apps__panel-brand">
              <span className="floating-apps__panel-logo-wrap">
                <img src={logo} alt="" className="floating-apps__panel-logo" />
              </span>
              <div>
                <p className="floating-apps__panel-eyebrow">Coming soon</p>
                <p className="floating-apps__panel-title">Tori AI</p>
              </div>
            </div>
            <button type="button" className="floating-apps__panel-close" onClick={closeAll} aria-label="Close">
              <FabCloseIcon />
            </button>
          </div>
          <p className="floating-apps__panel-body">
            Your household assistant will live here. Ask about inventory, expiry, and more.
          </p>
          <button type="button" className="floating-apps__panel-cta" disabled>
            Agent placeholder
          </button>
        </aside>
      ) : null}

      <input
        type="checkbox"
        id={togglerId}
        className="floating-apps__toggler"
        checked={open}
        onChange={() => {
          setOpen((v) => !v);
          setPanel("none");
        }}
      />
      <label htmlFor={togglerId} className="floating-apps__fab" aria-label={open ? "Close apps menu" : "Open apps menu"}>
        <span className="floating-apps__fab-icon" aria-hidden>
          <FabPlusIcon />
        </span>
      </label>

      <ul className="floating-apps__list">
        <li className="floating-apps__item floating-apps__item--1">
          <button
            type="button"
            className="floating-apps__bubble floating-apps__bubble--whisk"
            data-tooltip="Whisk"
            aria-label="Open Whisk"
            onClick={() => {
              setPanel("whisk");
              setOpen(false);
            }}
          >
            <img src={whiskLogo} alt="" />
          </button>
        </li>
        <li className="floating-apps__item floating-apps__item--2">
          <button
            type="button"
            className="floating-apps__bubble floating-apps__bubble--tori"
            data-tooltip="Tori AI"
            aria-label="Open Tori AI placeholder"
            onClick={() => {
              setPanel("tori");
              setOpen(false);
            }}
          >
            <span className="floating-apps__bubble-mark">
              <img src={logo} alt="" />
            </span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
