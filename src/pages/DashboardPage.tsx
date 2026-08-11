import { useMemo } from "react";
import { Link } from "react-router-dom";
import { resolveMediaUrl } from "../api/client";
import { AppShell } from "../components/layout/AppShell";
import { InventoryTransferBar } from "../components/inventory/InventoryTransferBar";
import { WhiskCrossLink } from "../components/ui/WhiskCrossLink";
import "../components/ui/Button.scss";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { buildTagRows, computeDashboardStats, folderLabel } from "../utils/inventoryFilters";
import { expirationLabel, readExpiringThreshold } from "../utils/expiring";
import {
  computeAttentionItems,
  computeCategoryCounts,
  computeDataGaps,
  computeLocationCounts,
  formatMoney,
  formatPercent,
  recentItems,
} from "../utils/inventoryValue";
import "./DashboardPage.scss";

const ATTENTION_LIMIT = 5;
const GAP_PREVIEW = 4;
const SNAPSHOT_LIMIT = 6;
const RECENT_LIMIT = 8;

export default function DashboardPage() {
  useEnsureInventory();
  const household = useHouseholdStore((s) => s.household);
  const folders = useInventoryStore((s) => s.folders);
  const items = useInventoryStore((s) => s.items);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const threshold = readExpiringThreshold();
  const stats = useMemo(() => computeDashboardStats(folders, items), [folders, items]);
  const attention = useMemo(() => computeAttentionItems(items, threshold), [items, threshold]);
  const gaps = useMemo(() => computeDataGaps(items, folders), [items, folders]);
  const categories = useMemo(() => computeCategoryCounts(folders, items), [folders, items]);
  const locations = useMemo(() => computeLocationCounts(items), [items]);
  const tags = useMemo(() => buildTagRows(items).slice(0, SNAPSHOT_LIMIT), [items]);
  const recent = useMemo(() => recentItems(items, RECENT_LIMIT), [items]);

  const hasInventory = stats.itemCount > 0 || stats.folderCount > 0;
  const checklist = {
    folder: stats.folderCount > 0,
    item: stats.itemCount > 0,
    price: stats.itemsWithPrice > 0,
    expiry: items.some((i) => Boolean(i.expirationDate)),
    invite: (household?.memberCount ?? 0) > 1,
  };

  const valueHint =
    stats.itemCount === 0
      ? "Add prices to track worth"
      : stats.itemsMissingPrice === stats.itemCount
        ? "Add prices to see a total"
        : stats.itemsMissingPrice > 0
          ? `${formatPercent(stats.pricedShare)} priced · ${stats.itemsMissingPrice} missing`
          : "Unit price × quantity";

  return (
    <AppShell>
      <div className="dashboard-page">
        <header className="dashboard-page__header">
          <div className="dashboard-page__heading">
            <h1 className="dashboard-page__title">Dashboard</h1>
            <p className="dashboard-page__subtitle">
              {household?.name
                ? `What needs attention in ${household.name}.`
                : "What needs attention in your household."}
            </p>
          </div>
          <div className="dashboard-page__actions">
            <Link to="/inventory" className="tori-button tori-button--primary">
              Add item
            </Link>
            <Link to="/inventory" className="tori-button tori-button--secondary">
              Add folder
            </Link>
            <Link to="/household" className="tori-button tori-button--ghost">
              Invite
            </Link>
          </div>
        </header>

        <InventoryTransferBar
          className="dashboard-page__transfer"
          householdName={household?.name}
          folders={folders}
          items={items}
        />

        {isLoading ? <p className="dashboard-page__status">Loading dashboard…</p> : null}

        {!isLoading && !hasInventory ? (
          <section className="dashboard-page__empty dashboard-checklist" aria-label="Getting started">
            <div>
              <h2 className="dashboard-checklist__title">Get your household set up</h2>
              <p className="dashboard-checklist__lead">
                A short path to a useful dashboard: organize, price, track expiry, and share.
              </p>
            </div>
            <ol className="dashboard-checklist__list">
              <li className={checklist.folder ? "is-done" : undefined}>
                <span>Create a folder</span>
                {!checklist.folder ? (
                  <Link to="/inventory">Open Inventory</Link>
                ) : (
                  <span className="dashboard-checklist__done">Done</span>
                )}
              </li>
              <li className={checklist.item ? "is-done" : undefined}>
                <span>Add an item</span>
                {!checklist.item ? (
                  <Link to="/inventory">Open Inventory</Link>
                ) : (
                  <span className="dashboard-checklist__done">Done</span>
                )}
              </li>
              <li className={checklist.price ? "is-done" : undefined}>
                <span>Add a price</span>
                {!checklist.price ? (
                  <Link to="/value">Open Value</Link>
                ) : (
                  <span className="dashboard-checklist__done">Done</span>
                )}
              </li>
              <li className={checklist.expiry ? "is-done" : undefined}>
                <span>Set an expiration date</span>
                {!checklist.expiry ? (
                  <Link to="/inventory">Open Inventory</Link>
                ) : (
                  <span className="dashboard-checklist__done">Done</span>
                )}
              </li>
              <li className={checklist.invite ? "is-done" : undefined}>
                <span>Invite someone to the household</span>
                {!checklist.invite ? (
                  <Link to="/household">Open Household</Link>
                ) : (
                  <span className="dashboard-checklist__done">Done</span>
                )}
              </li>
            </ol>
          </section>
        ) : null}

        <section className="dashboard-kpis" aria-label="Household totals">
          <Link to="/inventory" className="dashboard-kpi">
            <span className="dashboard-kpi__label">Folders</span>
            <span className="dashboard-kpi__value">{stats.folderCount}</span>
            <span className="dashboard-kpi__hint">Open inventory</span>
          </Link>
          <Link to="/inventory" className="dashboard-kpi">
            <span className="dashboard-kpi__label">Items</span>
            <span className="dashboard-kpi__value">{stats.itemCount}</span>
            <span className="dashboard-kpi__hint">Open inventory</span>
          </Link>
          <div className="dashboard-kpi dashboard-kpi--static">
            <span className="dashboard-kpi__label">Quantity</span>
            <span className="dashboard-kpi__value">{stats.totalQuantity}</span>
            <span className="dashboard-kpi__hint">Sum of item quantities</span>
          </div>
          <Link to="/value" className="dashboard-kpi">
            <span className="dashboard-kpi__label">Recorded value</span>
            <span className="dashboard-kpi__value dashboard-kpi__value--text">
              {stats.itemsWithPrice > 0 ? formatMoney(stats.totalValue) : "-"}
            </span>
            <span className="dashboard-kpi__hint">{valueHint}</span>
          </Link>
          <Link
            to="/expiring"
            className={`dashboard-kpi${attention.length > 0 ? " dashboard-kpi--alert" : ""}`}
          >
            <span className="dashboard-kpi__label">Expiring</span>
            <span className="dashboard-kpi__value">{attention.length}</span>
            <span className="dashboard-kpi__hint">
              Within {threshold} day{threshold === 1 ? "" : "s"} or overdue
            </span>
          </Link>
        </section>

        <div className="dashboard-page__split">
          <section className="dashboard-panel" aria-labelledby="dash-attention-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-attention-title" className="dashboard-panel__title">
                Needs attention
              </h2>
              <Link to="/expiring" className="dashboard-panel__link">
                View Expiring
              </Link>
            </div>
            {attention.length === 0 ? (
              <p className="dashboard-panel__empty">
                Nothing expiring within {threshold} day{threshold === 1 ? "" : "s"}.
              </p>
            ) : (
              <ul className="dashboard-list">
                {attention.slice(0, ATTENTION_LIMIT).map(({ item, daysUntil }) => (
                  <li key={item.id}>
                    <Link to={`/inventory/${item.id}`} className="dashboard-list__row">
                      <span className="dashboard-list__main">
                        <span className="dashboard-list__name">{item.name}</span>
                        <span className="dashboard-list__meta">
                          {folderLabel(folders, item.folderId)}
                        </span>
                      </span>
                      <span
                        className={`dashboard-list__badge${
                          daysUntil < 0 ? " dashboard-list__badge--danger" : ""
                        }`}
                      >
                        {expirationLabel(item.expirationDate)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {attention.length > ATTENTION_LIMIT ? (
              <p className="dashboard-panel__more">
                +{attention.length - ATTENTION_LIMIT} more on Expiring
              </p>
            ) : null}
          </section>

          <section className="dashboard-panel" aria-labelledby="dash-gaps-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-gaps-title" className="dashboard-panel__title">
                Data gaps
              </h2>
              <Link to="/value" className="dashboard-panel__link">
                View Value
              </Link>
            </div>
            {!hasInventory ? (
              <p className="dashboard-panel__empty">Gaps appear once you add items.</p>
            ) : (
              <ul className="dashboard-gaps">
                <li>
                  <div className="dashboard-gaps__head">
                    <span>Missing price</span>
                    <strong>{gaps.missingPrice.length}</strong>
                  </div>
                  {gaps.missingPrice.length > 0 ? (
                    <ul className="dashboard-gaps__items">
                      {gaps.missingPrice.slice(0, GAP_PREVIEW).map((item) => (
                        <li key={item.id}>
                          <Link to={`/inventory/${item.id}`}>{item.name}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="dashboard-gaps__ok">All items have a price.</p>
                  )}
                </li>
                <li>
                  <div className="dashboard-gaps__head">
                    <span>Missing location</span>
                    <strong>{gaps.missingLocation.length}</strong>
                  </div>
                  {gaps.missingLocation.length > 0 ? (
                    <ul className="dashboard-gaps__items">
                      {gaps.missingLocation.slice(0, GAP_PREVIEW).map((item) => (
                        <li key={item.id}>
                          <Link to={`/inventory/${item.id}`}>{item.name}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="dashboard-gaps__ok">All items have a location.</p>
                  )}
                </li>
                <li>
                  <div className="dashboard-gaps__head">
                    <span>Missing expiration (food)</span>
                    <strong>{gaps.missingExpiration.length}</strong>
                  </div>
                  {gaps.missingExpiration.length > 0 ? (
                    <ul className="dashboard-gaps__items">
                      {gaps.missingExpiration.slice(0, GAP_PREVIEW).map((item) => (
                        <li key={item.id}>
                          <Link to={`/inventory/${item.id}`}>{item.name}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="dashboard-gaps__ok">All food items have an expiration date.</p>
                  )}
                </li>
              </ul>
            )}
          </section>
        </div>

        <div className="dashboard-page__split dashboard-page__split--three">
          <section className="dashboard-panel" aria-labelledby="dash-cat-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-cat-title" className="dashboard-panel__title">
                By category
              </h2>
            </div>
            {categories.length === 0 ? (
              <p className="dashboard-panel__empty">No categories yet.</p>
            ) : (
              <ul className="dashboard-bars">
                {categories.slice(0, SNAPSHOT_LIMIT).map((row) => (
                  <li key={row.key}>
                    <div className="dashboard-bars__meta">
                      <span>{row.label}</span>
                      <span>
                        {row.count} item{row.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="dashboard-bars__track" aria-hidden>
                      <div className="dashboard-bars__fill" style={{ width: formatPercent(row.share) }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-panel" aria-labelledby="dash-tags-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-tags-title" className="dashboard-panel__title">
                Top tags
              </h2>
              <Link to="/tags" className="dashboard-panel__link">
                View Tags
              </Link>
            </div>
            {tags.length === 0 ? (
              <p className="dashboard-panel__empty">No tags yet.</p>
            ) : (
              <ul className="dashboard-chips">
                {tags.map((row) => (
                  <li key={row.tag}>
                    <span className="dashboard-chips__chip">
                      <span>{row.tag}</span>
                      <strong>{row.itemCount}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="dashboard-panel" aria-labelledby="dash-loc-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-loc-title" className="dashboard-panel__title">
                Locations
              </h2>
              <Link to="/locations" className="dashboard-panel__link">
                View Locations
              </Link>
            </div>
            {items.length === 0 ? (
              <p className="dashboard-panel__empty">No locations yet.</p>
            ) : (
              <>
                <p className="dashboard-panel__note">
                  {locations.unlocatedCount} without a location
                </p>
                {locations.rows.length === 0 ? (
                  <p className="dashboard-panel__empty">Every item is unlocated.</p>
                ) : (
                  <ul className="dashboard-bars">
                    {locations.rows.slice(0, SNAPSHOT_LIMIT).map((row) => (
                      <li key={row.key}>
                        <div className="dashboard-bars__meta">
                          <span>{row.label}</span>
                          <span>{row.count}</span>
                        </div>
                        <div className="dashboard-bars__track" aria-hidden>
                          <div
                            className="dashboard-bars__fill"
                            style={{ width: formatPercent(row.share) }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>
        </div>

        <div className="dashboard-page__split">
          <section className="dashboard-panel" aria-labelledby="dash-recent-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-recent-title" className="dashboard-panel__title">
                Recent items
              </h2>
              <Link to="/inventory" className="dashboard-panel__link">
                View Inventory
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="dashboard-panel__empty">Nothing recent yet.</p>
            ) : (
              <ul className="dashboard-recent">
                {recent.map((item) => {
                  const src = resolveMediaUrl(item.imageUrl);
                  return (
                    <li key={item.id}>
                      <Link to={`/inventory/${item.id}`} className="dashboard-recent__row">
                        <span className="dashboard-recent__thumb" aria-hidden>
                          {src ? <img src={src} alt="" /> : null}
                        </span>
                        <span className="dashboard-recent__copy">
                          <span className="dashboard-recent__name">{item.name}</span>
                          <span className="dashboard-recent__meta">
                            {folderLabel(folders, item.folderId)}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="dashboard-panel" aria-labelledby="dash-household-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-household-title" className="dashboard-panel__title">
                Household
              </h2>
              <Link to="/household" className="dashboard-panel__link">
                Manage
              </Link>
            </div>
            {household ? (
              <div className="dashboard-household">
                <p className="dashboard-household__name">{household.name}</p>
                <p className="dashboard-household__meta">
                  You’re {household.role === "owner" ? "the owner" : "a member"} ·{" "}
                  {household.memberCount} member{household.memberCount === 1 ? "" : "s"}
                </p>
                {household.memberCount <= 1 ? (
                  <p className="dashboard-household__nudge">
                    Share the invite code so the house stays in sync.{" "}
                    <Link to="/household">Copy invite on Household</Link>
                  </p>
                ) : (
                  <p className="dashboard-household__nudge">
                    Inventory updates live for everyone in this household.
                  </p>
                )}
              </div>
            ) : (
              <p className="dashboard-panel__empty">No active household.</p>
            )}
          </section>
        </div>

        <WhiskCrossLink />
      </div>
    </AppShell>
  );
}
