import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

  return (
    <AppShell>
      <div className="expiring-page">
        <header className="expiring-page__header">
          <div className="expiring-page__heading">
            <h1>Expiring</h1>
            <p>Items at or past your warning window, most urgent first.</p>
          </div>

          <label className="expiring-page__remind">
            <span className="expiring-page__remind-text">Warn me</span>
            <input
              className="expiring-page__remind-input"
              type="number"
              min={0}
              max={365}
              inputMode="numeric"
              aria-label="Warn me how many days before"
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
              day{thresholdText === "1" ? "" : "s"} before
            </span>
            <span className="expiring-page__remind-hint">
              Default {DEFAULT_EXPIRING_THRESHOLD}. Use 0 for today and overdue only.
            </span>
          </label>
        </header>

        {isLoading ? <p className="expiring-page__muted">Loading…</p> : null}

        {!isLoading && items.length === 0 ? (
          <div className="expiring-page__empty">
            <p>No items yet. Add inventory with expiration dates to track urgency here.</p>
            <Link to="/inventory" className="expiring-page__link">
              Go to Inventory
            </Link>
          </div>
        ) : null}

        {!isLoading && items.length > 0 ? (
          <section className="expiring-page__summary" aria-label="Expiring summary">
            <button
              type="button"
              className={`expiring-page__metric${viewFilter === "all" ? " is-active" : ""}`}
              onClick={() => setViewFilter("all")}
              aria-pressed={viewFilter === "all"}
            >
              <span className="expiring-page__metric-value">{stats.total}</span>
              <span className="expiring-page__metric-label">In window</span>
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
              <span className="expiring-page__metric-label">Overdue</span>
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
              <span className="expiring-page__metric-label">Coming up</span>
            </button>
          </section>
        ) : null}

        {!isLoading && items.length > 0 && expiring.length === 0 ? (
          <div className="expiring-page__empty">
            <p>
              Nothing expiring within {threshold} day{threshold === 1 ? "" : "s"}. You’re clear for
              now.
            </p>
            <Link to="/inventory" className="expiring-page__link">
              Review inventory
            </Link>
          </div>
        ) : null}

        {expiring.length > 0 && visible.length === 0 ? (
          <div className="expiring-page__empty">
            <p>
              No{" "}
              {viewFilter === "overdue" ? "overdue" : "coming up"} items in this window.
            </p>
            <button
              type="button"
              className="expiring-page__link-btn"
              onClick={() => setViewFilter("all")}
            >
              Show all in window
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
