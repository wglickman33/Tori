import { useEffect, useId, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import whiskLogo from "../../assets/logos/whiskLogoAmber.svg";
import logo from "../../assets/logos/website-logo.png";
import { getWhiskUrl } from "../../utils/whiskUrl";
import { useToriStore } from "../../store/toriStore";
import { toastInfo } from "../../store/toastStore";
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
  const { t } = useTranslation();
  const whiskHref = getWhiskUrl();
  const togglerId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<"none" | "whisk">("none");
  const openWidget = useToriStore((s) => s.openWidget);
  const location = useLocation();

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
      aria-label={t("apps.label")}
    >
      {panel === "whisk" ? (
        <aside className="floating-apps__panel" aria-label="Whisk">
          <div className="floating-apps__panel-top">
            <div className="floating-apps__panel-brand">
              <img src={whiskLogo} alt="" className="floating-apps__panel-logo" />
              <div>
                <p className="floating-apps__panel-eyebrow">{t("apps.alsoFromUs")}</p>
                <p className="floating-apps__panel-title">Whisk</p>
              </div>
            </div>
            <button type="button" className="floating-apps__panel-close" onClick={closeAll} aria-label={t("common.close")}>
              <FabCloseIcon />
            </button>
          </div>
          <p className="floating-apps__panel-body">
            {t("apps.whiskPanel")}
          </p>
          <a
            className="floating-apps__panel-cta floating-apps__panel-cta--whisk"
            href={whiskHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeAll}
          >
            {t("apps.openWhisk")}
          </a>
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
      <label htmlFor={togglerId} className="floating-apps__fab" aria-label={open ? t("apps.closeMenu") : t("apps.openMenu")}>
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
            aria-label={t("whisk.aria")}
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
            aria-label={t("ai.open")}
            onClick={() => {
              setPanel("none");
              setOpen(false);
              if (location.pathname === "/ai") {
                toastInfo(t("ai.alreadyFullView"), {
                  actionLabel: t("ai.useWidgetInventory"),
                  actionHref: "/inventory",
                  onAction: openWidget,
                });
                return;
              }
              openWidget();
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
