import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout/AppShell";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useInventoryStore } from "../store/inventoryStore";
import { daysUntilExpiration, folderLabel } from "../utils/inventoryFilters";
import {
  DEFAULT_EXPIRING_THRESHOLD,
  expirationLabel,
  filterExpiringItems,
  readExpiringThreshold,
  writeExpiringThreshold,
} from "../utils/expiring";
import "./ExpiringPage.scss";

type ViewFilter = "all" | "overdue" | "soon";

export default function ExpiringPage() {
  useEnsureInventory();
  const { t } = useTranslation();
  const folders = useInventoryStore((s) => s.folders);
  const items = useInventoryStore((s) => s.items);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const [threshold, setThreshold] = useState(() => readExpiringThreshold());
  const [thresholdText, setThresholdText] = useState(String(threshold));
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");

  const expiring = useMemo(() => filterExpiringItems(items, threshold), [items, threshold]);

  const stats = useMemo(() => {
    let overdue = 0;
    let soon = 0;
    for (const item of expiring) {
      const days = daysUntilExpiration(item.expirationDate);
      if (days !== null && days < 0) overdue += 1;
      else soon += 1;
    }
    return { overdue, soon, total: expiring.length };
  }, [expiring]);

  const visible = useMemo(() => {
    if (viewFilter === "all") return expiring;
    return expiring.filter((item) => {
      const days = daysUntilExpiration(item.expirationDate);
      const overdue = days !== null && days < 0;
      return viewFilter === "overdue" ? overdue : !overdue;
    });
  }, [expiring, viewFilter]);

  const commitThreshold = (raw: string) => {
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 365) {
      setThresholdText(String(threshold));
      return;
    }
    setThreshold(n);
    setThresholdText(String(n));
    writeExpiringThreshold(n);
  };

  const daysBeforeCount = thresholdText === "1" ? 1 : Number(thresholdText) || 0;

  return (
    <AppShell>
      <div className="expiring-page">
        <header className="expiring-page__header">
          <div className="expiring-page__heading">
            <h1>{t("expiring.title")}</h1>
            <p>{t("expiring.subtitle")}</p>
          </div>

          <label className="expiring-page__remind">
            <span className="expiring-page__remind-text">{t("expiring.warnMe")}</span>
            <input
              className="expiring-page__remind-input"
              type="number"
              min={0}
              max={365}
              inputMode="numeric"
              aria-label={t("expiring.warnAria")}
              value={thresholdText}
              onChange={(e) => setThresholdText(e.target.value)}
              onBlur={() => commitThreshold(thresholdText)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                  commitThreshold(thresholdText);
                }
              }}
            />
            <span className="expiring-page__remind-text">
              {t("expiring.daysBefore", { count: daysBeforeCount === 1 ? 1 : 2 })}
            </span>
            <span className="expiring-page__remind-hint">
              {t("expiring.defaultHint", { count: DEFAULT_EXPIRING_THRESHOLD })}
            </span>
          </label>
        </header>

        {isLoading ? <p className="expiring-page__muted">{t("common.loading")}</p> : null}

        {!isLoading && items.length === 0 ? (
          <div className="expiring-page__empty">
            <p>{t("expiring.empty")}</p>
            <Link to="/inventory" className="expiring-page__link">
              {t("expiring.goInventory")}
            </Link>
          </div>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <section className="expiring-page__summary" aria-label={t("expiring.summary")}>
            <button
              type="button"
              className={`expiring-page__metric${viewFilter === "all" ? " is-active" : ""}`}
              onClick={() => setViewFilter("all")}
              aria-pressed={viewFilter === "all"}
            >
              <span className="expiring-page__metric-value">{stats.total}</span>
              <span className="expiring-page__metric-label">{t("expiring.inWindow")}</span>
            </button>
            <button
              type="button"
              className={`expiring-page__metric expiring-page__metric--overdue${
                viewFilter === "overdue" ? " is-active" : ""
              }`}
              onClick={() => setViewFilter("overdue")}
              aria-pressed={viewFilter === "overdue"}
            >
              <span className="expiring-page__metric-value">{stats.overdue}</span>
              <span className="expiring-page__metric-label">{t("expiring.overdue")}</span>
            </button>
            <button
              type="button"
              className={`expiring-page__metric expiring-page__metric--soon${
                viewFilter === "soon" ? " is-active" : ""
              }`}
              onClick={() => setViewFilter("soon")}
              aria-pressed={viewFilter === "soon"}
            >
              <span className="expiring-page__metric-value">{stats.soon}</span>
              <span className="expiring-page__metric-label">{t("expiring.comingUp")}</span>
            </button>
          </section>
        ) : null}

        {!isLoading && items.length > 0 && expiring.length === 0 ? (
          <div className="expiring-page__empty">
            <p>{t("expiring.nothingInWindow", { count: threshold })}</p>
            <Link to="/inventory" className="expiring-page__link">
              {t("expiring.reviewInventory")}
            </Link>
          </div>
        ) : null}

        {expiring.length > 0 && visible.length === 0 ? (
          <div className="expiring-page__empty">
            <p>{viewFilter === "overdue" ? t("expiring.noOverdue") : t("expiring.noComingUp")}</p>
            <button
              type="button"
              className="expiring-page__link-btn"
              onClick={() => setViewFilter("all")}
            >
              {t("expiring.showAll")}
            </button>
          </div>
        ) : null}

        {visible.length > 0 ? (
          <ul className="expiring-page__feed">
            {visible.map((item) => {
              const days = daysUntilExpiration(item.expirationDate);
              const overdue = days !== null && days < 0;
              const label = expirationLabel(item.expirationDate);
              return (
                <li
                  key={item.id}
                  className={`expiring-page__row${overdue ? " is-overdue" : " is-soon"}`}
                >
                  <Link to={`/inventory/${item.id}`} className="expiring-page__row-main">
                    <span className="expiring-page__row-copy">
                      <span className="expiring-page__name">{item.name}</span>
                      <span className="expiring-page__meta">
                        {folderLabel(folders, item.folderId)}
                        {item.expirationDate ? ` · ${item.expirationDate}` : ""}
                      </span>
                    </span>
                    <span
                      className={`expiring-page__badge${overdue ? " is-overdue" : " is-soon"}`}
                    >
                      {label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </AppShell>
  );
}
