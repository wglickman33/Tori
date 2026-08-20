import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
      ? t("dashboard.hintAddPrices")
      : stats.itemsMissingPrice === stats.itemCount
        ? t("dashboard.hintSeeTotal")
        : stats.itemsMissingPrice > 0
          ? t("dashboard.hintPricedMissing", {
              priced: formatPercent(stats.pricedShare),
              missing: stats.itemsMissingPrice,
            })
          : t("dashboard.hintUnitTimesQty");

  return (
    <AppShell>
      <div className="dashboard-page">
        <header className="dashboard-page__header">
          <div className="dashboard-page__heading">
            <h1 className="dashboard-page__title">{t("dashboard.title")}</h1>
            <p className="dashboard-page__subtitle">
              {household?.name
                ? t("dashboard.subtitleNamed", { name: household.name })
                : t("dashboard.subtitle")}
            </p>
          </div>
          <div className="dashboard-page__actions">
            <Link to="/inventory" className="tori-button tori-button--primary">
              {t("inventory.addItem")}
            </Link>
            <Link to="/inventory" className="tori-button tori-button--secondary">
              {t("inventory.addFolder")}
            </Link>
            <Link to="/household" className="tori-button tori-button--ghost">
              {t("dashboard.invite")}
            </Link>
          </div>
        </header>

        <InventoryTransferBar
          className="dashboard-page__transfer"
          householdName={household?.name}
          folders={folders}
          items={items}
        />

        {isLoading ? <p className="dashboard-page__status">{t("dashboard.loading")}</p> : null}

        {!isLoading && !hasInventory ? (
          <section className="dashboard-page__empty dashboard-checklist" aria-label={t("dashboard.gettingStarted")}>
            <div>
              <h2 className="dashboard-checklist__title">{t("dashboard.setupTitle")}</h2>
              <p className="dashboard-checklist__lead">{t("dashboard.setupLead")}</p>
            </div>
            <ol className="dashboard-checklist__list">
              <li className={checklist.folder ? "is-done" : undefined}>
                <span>{t("dashboard.stepFolder")}</span>
                {!checklist.folder ? (
                  <Link to="/inventory">{t("dashboard.openInventory")}</Link>
                ) : (
                  <span className="dashboard-checklist__done">{t("common.done")}</span>
                )}
              </li>
              <li className={checklist.item ? "is-done" : undefined}>
                <span>{t("dashboard.stepItem")}</span>
                {!checklist.item ? (
                  <Link to="/inventory">{t("dashboard.openInventory")}</Link>
                ) : (
                  <span className="dashboard-checklist__done">{t("common.done")}</span>
                )}
              </li>
              <li className={checklist.price ? "is-done" : undefined}>
                <span>{t("dashboard.stepPrice")}</span>
                {!checklist.price ? (
                  <Link to="/value">{t("dashboard.openValue")}</Link>
                ) : (
                  <span className="dashboard-checklist__done">{t("common.done")}</span>
                )}
              </li>
              <li className={checklist.expiry ? "is-done" : undefined}>
                <span>{t("dashboard.stepExpiry")}</span>
                {!checklist.expiry ? (
                  <Link to="/inventory">{t("dashboard.openInventory")}</Link>
                ) : (
                  <span className="dashboard-checklist__done">{t("common.done")}</span>
                )}
              </li>
              <li className={checklist.invite ? "is-done" : undefined}>
                <span>{t("dashboard.stepInvite")}</span>
                {!checklist.invite ? (
                  <Link to="/household">{t("dashboard.openHousehold")}</Link>
                ) : (
                  <span className="dashboard-checklist__done">{t("common.done")}</span>
                )}
              </li>
            </ol>
          </section>
        ) : null}

        <section className="dashboard-kpis" aria-label={t("dashboard.totals")}>
          <Link to="/inventory" className="dashboard-kpi">
            <span className="dashboard-kpi__label">{t("dashboard.folders")}</span>
            <span className="dashboard-kpi__value">{stats.folderCount}</span>
            <span className="dashboard-kpi__hint">{t("dashboard.viewInventory")}</span>
          </Link>
          <Link to="/inventory" className="dashboard-kpi">
            <span className="dashboard-kpi__label">{t("dashboard.items")}</span>
            <span className="dashboard-kpi__value">{stats.itemCount}</span>
            <span className="dashboard-kpi__hint">{t("dashboard.viewInventory")}</span>
          </Link>
          <div className="dashboard-kpi dashboard-kpi--static">
            <span className="dashboard-kpi__label">{t("dashboard.quantity")}</span>
            <span className="dashboard-kpi__value">{stats.totalQuantity}</span>
            <span className="dashboard-kpi__hint">{t("dashboard.quantityHint")}</span>
          </div>
          <Link to="/value" className="dashboard-kpi">
            <span className="dashboard-kpi__label">{t("dashboard.recordedValue")}</span>
            <span className="dashboard-kpi__value dashboard-kpi__value--text">
              {stats.itemsWithPrice > 0 ? formatMoney(stats.totalValue) : t("common.dash")}
            </span>
            <span className="dashboard-kpi__hint">{valueHint}</span>
          </Link>
          <Link
            to="/expiring"
            className={`dashboard-kpi${attention.length > 0 ? " dashboard-kpi--alert" : ""}`}
          >
            <span className="dashboard-kpi__label">{t("dashboard.expiring")}</span>
            <span className="dashboard-kpi__value">{attention.length}</span>
            <span className="dashboard-kpi__hint">
              {t("dashboard.withinOrOverdue", { count: threshold })}
            </span>
          </Link>
        </section>

        <div className="dashboard-page__split">
          <section className="dashboard-panel" aria-labelledby="dash-attention-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-attention-title" className="dashboard-panel__title">
                {t("dashboard.needsAttention")}
              </h2>
              <Link to="/expiring" className="dashboard-panel__link">
                {t("dashboard.viewExpiring")}
              </Link>
            </div>
            {attention.length === 0 ? (
              <p className="dashboard-panel__empty">
                {t("dashboard.nothingExpiring", { count: threshold })}
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
                {t("dashboard.moreOnExpiring", { count: attention.length - ATTENTION_LIMIT })}
              </p>
            ) : null}
          </section>

          <section className="dashboard-panel" aria-labelledby="dash-gaps-title">
            <div className="dashboard-panel__header">
              <h2 id="dash-gaps-title" className="dashboard-panel__title">
                {t("dashboard.dataGaps")}
              </h2>
              <Link to="/value" className="dashboard-panel__link">
                {t("dashboard.viewValue")}
              </Link>
            </div>
            {!hasInventory ? (
              <p className="dashboard-panel__empty">{t("dashboard.gapsAppear")}</p>
            ) : (
              <ul className="dashboard-gaps">
                <li>
                  <div className="dashboard-gaps__head">
                    <span>{t("dashboard.missingPrice")}</span>
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
                    <p className="dashboard-gaps__ok">{t("dashboard.allHavePrice")}</p>
                  )}
                </li>
                <li>
                  <div className="dashboard-gaps__head">
                    <span>{t("dashboard.missingLocation")}</span>
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
                    <p className="dashboard-gaps__ok">{t("dashboard.allHaveLocation")}</p>
                  )}
                </li>
                <li>
                  <div className="dashboard-gaps__head">
                    <span>{t("dashboard.missingExpirationFood")}</span>
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
                    <p className="dashboard-gaps__ok">{t("dashboard.allFoodHaveExpiry")}</p>
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
                {t("dashboard.byCategory")}
              </h2>
            </div>
            {categories.length === 0 ? (
              <p className="dashboard-panel__empty">{t("dashboard.noCategories")}</p>
            ) : (
              <ul className="dashboard-bars">
                {categories.slice(0, SNAPSHOT_LIMIT).map((row) => (
                  <li key={row.key}>
                    <div className="dashboard-bars__meta">
                      <span>{row.label}</span>
                      <span>
                        {t("common.item", { count: row.count })}
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
                {t("dashboard.topTags")}
              </h2>
              <Link to="/tags" className="dashboard-panel__link">
                {t("dashboard.viewTags")}
              </Link>
            </div>
            {tags.length === 0 ? (
              <p className="dashboard-panel__empty">{t("dashboard.noTags")}</p>
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
                {t("dashboard.locations")}
              </h2>
              <Link to="/locations" className="dashboard-panel__link">
                {t("dashboard.viewLocations")}
              </Link>
            </div>
            {items.length === 0 ? (
              <p className="dashboard-panel__empty">{t("dashboard.noLocations")}</p>
            ) : (
              <>
                <p className="dashboard-panel__note">
                  {t("dashboard.withoutLocation", { count: locations.unlocatedCount })}
                </p>
                {locations.rows.length === 0 ? (
                  <p className="dashboard-panel__empty">{t("dashboard.everyUnlocated")}</p>
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
                {t("dashboard.recentItems")}
              </h2>
              <Link to="/inventory" className="dashboard-panel__link">
                {t("dashboard.viewInventory")}
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="dashboard-panel__empty">{t("dashboard.nothingRecent")}</p>
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
                {t("household.title")}
              </h2>
              <Link to="/household" className="dashboard-panel__link">
                {t("household.manage")}
              </Link>
            </div>
            {household ? (
              <div className="dashboard-household">
                <p className="dashboard-household__name">{household.name}</p>
                <p className="dashboard-household__meta">
                  {t("household.youAreRole", {
                    role:
                      household.role === "owner"
                        ? t("household.youAreOwner")
                        : t("household.youAreMember"),
                  })}{" "}
                  · {t("common.memberCount", { count: household.memberCount })}
                </p>
                {household.memberCount <= 1 ? (
                  <p className="dashboard-household__nudge">
                    {t("household.nudgeShare")}{" "}
                    <Link to="/household">{t("household.copyInvite")}</Link>
                  </p>
                ) : (
                  <p className="dashboard-household__nudge">{t("household.nudgeLive")}</p>
                )}
              </div>
            ) : (
              <p className="dashboard-panel__empty">{t("household.noActive")}</p>
            )}
          </section>
        </div>

        <WhiskCrossLink />
      </div>
    </AppShell>
  );
}
