import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import whiskLogo from "../../assets/logos/whiskLogoAmber.svg";
import { getWhiskUrl } from "../../utils/whiskUrl";
import "./WhiskWidget.scss";

const STORAGE_KEY = "tori_whisk_widget_minimized";

export function WhiskWidget() {
  const { t } = useTranslation();
  const href = getWhiskUrl();
  const [minimized, setMinimized] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, minimized ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [minimized]);

  if (minimized) {
    return (
      <button
        type="button"
        className="whisk-widget whisk-widget--minimized"
        onClick={() => setMinimized(false)}
        aria-label={t("whisk.openPromo")}
        title="Whisk"
      >
        <img src={whiskLogo} alt="" className="whisk-widget__mark" />
      </button>
    );
  }

  return (
    <aside className="whisk-widget" aria-label="Whisk">
      <div className="whisk-widget__top">
        <div className="whisk-widget__brand">
          <img src={whiskLogo} alt="" className="whisk-widget__logo" />
          <div>
            <p className="whisk-widget__eyebrow">{t("apps.alsoFromUs")}</p>
            <p className="whisk-widget__title">Whisk</p>
          </div>
        </div>
        <button
          type="button"
          className="whisk-widget__minimize"
          onClick={() => setMinimized(true)}
          aria-label={t("whisk.minimizePromo")}
        >
          −
        </button>
      </div>
      <p className="whisk-widget__body">{t("apps.whiskPanel")}</p>
      <a className="whisk-widget__cta" href={href} target="_blank" rel="noopener noreferrer">
        {t("apps.openWhisk")}
      </a>
    </aside>
  );
}
