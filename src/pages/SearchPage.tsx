import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "../api/client";
import { AppShell } from "../components/layout/AppShell";
import { TextField } from "../components/ui/TextField";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useInventoryStore } from "../store/inventoryStore";
import {
  collectTags,
  daysUntilExpiration,
  folderLabel,
  INDEPENDENT_FOLDER_KEY,
  parsePrice,
} from "../utils/inventoryFilters";
import { expirationLabel, readExpiringThreshold } from "../utils/expiring";
import { formatMoney } from "../utils/inventoryValue";
import {
  NO_LOCATION_KEY,
  collectCategories,
  collectLocations,
  describeFolderFilter,
  emptyInventorySearchFilters,
  hasActiveInventoryFilters,
  runInventorySearch,
  type ExpirationFilter,
  type InventorySearchFilters,
  type PhotoFilter,
  type SearchSort,
} from "../utils/inventorySearchQuery";
import "./SearchPage.scss";

function parseList(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => decodeURIComponent(s.trim()))
    .filter(Boolean);
}

function encodeList(values: string[]): string | null {
  if (values.length === 0) return null;
  return values.map((v) => encodeURIComponent(v)).join(",");
}

function filtersFromParams(params: URLSearchParams): InventorySearchFilters {
  const exp = params.get("exp") as ExpirationFilter | null;
  const photo = params.get("photo") as PhotoFilter | null;
  const minRaw = params.get("min");
  const maxRaw = params.get("max");
  const minPrice = minRaw === null || minRaw === "" ? null : Number(minRaw);
  const maxPrice = maxRaw === null || maxRaw === "" ? null : Number(maxRaw);
  return {
    query: params.get("q") ?? "",
    folderIds: parseList(params.get("folder")),
    tags: parseList(params.get("tag")),
    categories: parseList(params.get("cat")),
    locations: parseList(params.get("loc")),
    minPrice: minPrice !== null && Number.isFinite(minPrice) ? minPrice : null,
    maxPrice: maxPrice !== null && Number.isFinite(maxPrice) ? maxPrice : null,
    expiration:
      exp && ["any", "has", "missing", "expiring", "overdue"].includes(exp) ? exp : "any",
    hasPhoto: photo && ["any", "yes", "no"].includes(photo) ? photo : "any",
  };
}

function writeFiltersToParams(filters: InventorySearchFilters, sort: SearchSort): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  const folder = encodeList(filters.folderIds);
  if (folder) params.set("folder", folder);
  const tag = encodeList(filters.tags);
  if (tag) params.set("tag", tag);
  const cat = encodeList(filters.categories);
  if (cat) params.set("cat", cat);
  const loc = encodeList(filters.locations);
  if (loc) params.set("loc", loc);
  if (filters.minPrice !== null) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("max", String(filters.maxPrice));
  if (filters.expiration !== "any") params.set("exp", filters.expiration);
  if (filters.hasPhoto !== "any") params.set("photo", filters.hasPhoto);
  if (sort !== "relevance" && sort !== "name") params.set("sort", sort);
  else if (sort === "name" && !filters.query.trim()) {
    /* default name - omit */
  } else if (sort === "relevance" && filters.query.trim()) {
    /* default relevance with query - omit */
  } else if (sort === "name" && filters.query.trim()) {
    params.set("sort", "name");
  }
  return params;
}

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function SearchPage() {
  useEnsureInventory();
  const { t } = useTranslation();
  const folders = useInventoryStore((s) => s.folders);
  const items = useInventoryStore((s) => s.items);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<InventorySearchFilters>(() =>
    filtersFromParams(searchParams)
  );
  const [queryText, setQueryText] = useState(() => searchParams.get("q") ?? "");
  const [minText, setMinText] = useState(() => searchParams.get("min") ?? "");
  const [maxText, setMaxText] = useState(() => searchParams.get("max") ?? "");
  const [sort, setSort] = useState<SearchSort>(() => {
    const s = searchParams.get("sort");
    if (s === "price" || s === "expiry" || s === "name" || s === "relevance") return s;
    return searchParams.get("q")?.trim() ? "relevance" : "name";
  });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const threshold = readExpiringThreshold();
  const tags = useMemo(() => collectTags(items), [items]);
  const locations = useMemo(() => collectLocations(items), [items]);
  const categories = useMemo(() => collectCategories(folders, items), [folders, items]);

  // Debounce free-text into filters
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((prev) => (prev.query === queryText ? prev : { ...prev, query: queryText }));
    }, 160);
    return () => window.clearTimeout(timer);
  }, [queryText]);

  // Live price fields
  useEffect(() => {
    const minPrice = minText === "" ? null : Number(minText);
    const maxPrice = maxText === "" ? null : Number(maxText);
    setFilters((prev) => ({
      ...prev,
      minPrice: minPrice !== null && Number.isFinite(minPrice) ? minPrice : null,
      maxPrice: maxPrice !== null && Number.isFinite(maxPrice) ? maxPrice : null,
    }));
  }, [minText, maxText]);

  // Sync URL (query already debounced into filters)
  useEffect(() => {
    const upcoming = writeFiltersToParams(filters, sort).toString();
    if (searchParams.toString() !== upcoming) {
      setSearchParams(new URLSearchParams(upcoming), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only push when filters/sort change
  }, [filters, sort, setSearchParams]);

  const results = useMemo(
    () => runInventorySearch(folders, items, filters, sort),
    [folders, items, filters, sort]
  );

  const clearAll = () => {
    setFilters(emptyInventorySearchFilters());
    setQueryText("");
    setMinText("");
    setMaxText("");
    setSort("name");
  };

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (filters.query.trim()) {
      chips.push({
        key: "q",
        label: t("search.chipSearch", { query: filters.query.trim() }),
        onRemove: () => {
          setQueryText("");
          setFilters((p) => ({ ...p, query: "" }));
        },
      });
    }
    for (const id of filters.folderIds) {
      chips.push({
        key: `folder-${id}`,
        label: t("search.chipFolder", {
          name:
            id === INDEPENDENT_FOLDER_KEY
              ? t("inventory.independentLabel")
              : describeFolderFilter(folders, id),
        }),
        onRemove: () => setFilters((p) => ({ ...p, folderIds: p.folderIds.filter((f) => f !== id) })),
      });
    }
    for (const tag of filters.tags) {
      chips.push({
        key: `tag-${tag}`,
        label: t("search.chipTag", { tag }),
        onRemove: () => setFilters((p) => ({ ...p, tags: p.tags.filter((x) => x !== tag) })),
      });
    }
    for (const cat of filters.categories) {
      chips.push({
        key: `cat-${cat}`,
        label: t("search.chipCategory", {
          name: t(`categories.${cat}`, { defaultValue: cat }),
        }),
        onRemove: () =>
          setFilters((p) => ({ ...p, categories: p.categories.filter((c) => c !== cat) })),
      });
    }
    for (const loc of filters.locations) {
      chips.push({
        key: `loc-${loc}`,
        label: t("search.chipLocation", {
          name: loc === NO_LOCATION_KEY ? t("inventory.noLocation") : loc,
        }),
        onRemove: () =>
          setFilters((p) => ({ ...p, locations: p.locations.filter((l) => l !== loc) })),
      });
    }
    if (filters.minPrice !== null) {
      chips.push({
        key: "min",
        label: t("search.chipMin", { amount: formatMoney(filters.minPrice) }),
        onRemove: () => {
          setMinText("");
          setFilters((p) => ({ ...p, minPrice: null }));
        },
      });
    }
    if (filters.maxPrice !== null) {
      chips.push({
        key: "max",
        label: t("search.chipMax", { amount: formatMoney(filters.maxPrice) }),
        onRemove: () => {
          setMaxText("");
          setFilters((p) => ({ ...p, maxPrice: null }));
        },
      });
    }
    if (filters.expiration !== "any") {
      const labels: Record<ExpirationFilter, string> = {
        any: t("common.any"),
        has: t("search.hasExpiration"),
        missing: t("search.missingExpiration"),
        expiring: t("search.expiringSoon"),
        overdue: t("inventory.overdue"),
      };
      chips.push({
        key: "exp",
        label: labels[filters.expiration],
        onRemove: () => setFilters((p) => ({ ...p, expiration: "any" })),
      });
    }
    if (filters.hasPhoto !== "any") {
      chips.push({
        key: "photo",
        label: filters.hasPhoto === "yes" ? t("search.hasPhoto") : t("search.noPhoto"),
        onRemove: () => setFilters((p) => ({ ...p, hasPhoto: "any" })),
      });
    }
    return chips;
  }, [filters, folders, t]);

  const sortOptions: { value: SearchSort; label: string }[] = filters.query.trim()
    ? [
        { value: "relevance", label: t("search.relevance") },
        { value: "name", label: t("inventory.name") },
        { value: "price", label: t("inventory.price") },
        { value: "expiry", label: t("search.expiration") },
      ]
    : [
        { value: "name", label: t("inventory.name") },
        { value: "price", label: t("inventory.price") },
        { value: "expiry", label: t("search.expiration") },
      ];

  return (
    <AppShell>
      <div className="search-page">
        <header className="search-page__header">
          <div className="search-page__heading">
            <h1 className="search-page__title">{t("search.title")}</h1>
            <p className="search-page__subtitle">{t("search.subtitle")}</p>
          </div>
        </header>

        <div className="search-page__bar">
          <label className="search-page__query">
            <span className="search-page__query-label">{t("common.search")}</span>
            <input
              type="search"
              value={queryText}
              onChange={(e) => {
                const next = e.target.value;
                setQueryText(next);
                if (next.trim() && sort === "name") setSort("relevance");
                if (!next.trim() && sort === "relevance") setSort("name");
              }}
              placeholder={t("search.placeholder")}
              autoComplete="off"
              spellCheck={false}
            />
            {queryText ? (
              <button
                type="button"
                className="search-page__query-clear"
                aria-label={t("search.clearSearch")}
                onClick={() => {
                  setQueryText("");
                  setFilters((p) => ({ ...p, query: "" }));
                  if (sort === "relevance") setSort("name");
                }}
              >
                ×
              </button>
            ) : null}
          </label>
        </div>

        {activeChips.length > 0 ? (
          <div className="search-page__chips" aria-label={t("search.activeFilters")}>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="search-page__chip"
                onClick={chip.onRemove}
              >
                <span>{chip.label}</span>
                <span aria-hidden>×</span>
              </button>
            ))}
            <button type="button" className="search-page__chips-clear" onClick={clearAll}>
              {t("common.clearAll")}
            </button>
          </div>
        ) : null}

        <div className="search-page__toolbar-mobile">
          <button
            type="button"
            className="search-page__filters-toggle"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((v) => !v)}
          >
            {hasActiveInventoryFilters(filters)
              ? t("search.filtersOn", {
                  label: filtersOpen ? t("search.hideFilters") : t("common.filters"),
                })
              : filtersOpen
                ? t("search.hideFilters")
                : t("common.filters")}
          </button>
        </div>

        <div className="search-page__grid">
          <aside
            className={`search-page__filters${filtersOpen ? " is-open" : ""}`}
            aria-label={t("common.filters")}
          >
            <section>
              <h2>{t("search.folders")}</h2>
              <div className="search-page__scroll">
                <label className="search-page__check">
                  <input
                    type="checkbox"
                    checked={filters.folderIds.includes(INDEPENDENT_FOLDER_KEY)}
                    onChange={() =>
                      setFilters((p) => ({
                        ...p,
                        folderIds: toggleValue(p.folderIds, INDEPENDENT_FOLDER_KEY),
                      }))
                    }
                  />
                  {t("inventory.independent")}
                </label>
                {folders.map((folder) => (
                  <label key={folder.id} className="search-page__check">
                    <input
                      type="checkbox"
                      checked={filters.folderIds.includes(folder.id)}
                      onChange={() =>
                        setFilters((p) => ({
                          ...p,
                          folderIds: toggleValue(p.folderIds, folder.id),
                        }))
                      }
                    />
                    {folder.name}
                  </label>
                ))}
                {folders.length === 0 ? (
                  <p className="search-page__muted">{t("search.noFolders")}</p>
                ) : null}
              </div>
            </section>

            <section>
              <h2>{t("search.tags")}</h2>
              {tags.length === 0 ? (
                <p className="search-page__muted">{t("search.noTags")}</p>
              ) : (
                <div className="search-page__tag-chips">
                  {tags.map((tag) => {
                    const on = filters.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`search-page__tag-chip${on ? " is-on" : ""}`}
                        aria-pressed={on}
                        onClick={() =>
                          setFilters((p) => ({ ...p, tags: toggleValue(p.tags, tag) }))
                        }
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2>{t("search.category")}</h2>
              <div className="search-page__scroll">
                {categories.length === 0 ? (
                  <p className="search-page__muted">{t("search.noCategories")}</p>
                ) : (
                  categories.map((cat) => (
                    <label key={cat} className="search-page__check">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(cat)}
                        onChange={() =>
                          setFilters((p) => ({
                            ...p,
                            categories: toggleValue(p.categories, cat),
                          }))
                        }
                      />
                      {t(`categories.${cat}`, { defaultValue: cat })}
                    </label>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2>{t("search.location")}</h2>
              <div className="search-page__scroll">
                <label className="search-page__check">
                  <input
                    type="checkbox"
                    checked={filters.locations.includes(NO_LOCATION_KEY)}
                    onChange={() =>
                      setFilters((p) => ({
                        ...p,
                        locations: toggleValue(p.locations, NO_LOCATION_KEY),
                      }))
                    }
                  />
                  {t("inventory.noLocation")}
                </label>
                {locations.map((loc) => (
                  <label key={loc} className="search-page__check">
                    <input
                      type="checkbox"
                      checked={filters.locations.includes(loc)}
                      onChange={() =>
                        setFilters((p) => ({
                          ...p,
                          locations: toggleValue(p.locations, loc),
                        }))
                      }
                    />
                    {loc}
                  </label>
                ))}
              </div>
            </section>

            <section className="search-page__price">
              <h2>{t("search.price")}</h2>
              <div className="search-page__price-fields">
                <TextField
                  label={t("common.min")}
                  type="number"
                  min={0}
                  step="0.01"
                  value={minText}
                  onChange={(e) => setMinText(e.target.value)}
                />
                <TextField
                  label={t("common.max")}
                  type="number"
                  min={0}
                  step="0.01"
                  value={maxText}
                  onChange={(e) => setMaxText(e.target.value)}
                />
              </div>
              <p className="search-page__muted">
                {t("search.priceHint")}
              </p>
            </section>

            <section>
              <h2>{t("search.expiration")}</h2>
              <label className="search-page__select">
                <span className="search-page__select-label">{t("common.status")}</span>
                <select
                  value={filters.expiration}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      expiration: e.target.value as ExpirationFilter,
                    }))
                  }
                >
                  <option value="any">{t("common.any")}</option>
                  <option value="has">{t("search.hasDate")}</option>
                  <option value="missing">{t("search.missingDate")}</option>
                  <option value="expiring">{t("search.expiringSoonDays", { count: threshold })}</option>
                  <option value="overdue">{t("inventory.overdue")}</option>
                </select>
              </label>
            </section>

            <section>
              <h2>{t("search.photo")}</h2>
              <label className="search-page__select">
                <span className="search-page__select-label">{t("search.hasPhoto")}</span>
                <select
                  value={filters.hasPhoto}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, hasPhoto: e.target.value as PhotoFilter }))
                  }
                >
                  <option value="any">{t("common.any")}</option>
                  <option value="yes">{t("search.hasPhoto")}</option>
                  <option value="no">{t("search.noPhoto")}</option>
                </select>
              </label>
            </section>
          </aside>

          <section className="search-page__results" aria-live="polite">
            <div className="search-page__results-toolbar">
              <p className="search-page__count">
                {isLoading
                  ? t("common.loading")
                  : t("search.showingOf", { shown: results.length, count: items.length })}
              </p>
              <label className="search-page__sort">
                <span>{t("common.sort")}</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SearchSort)}
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {!isLoading && items.length === 0 ? (
              <div className="search-page__empty">
                <p>{t("search.noItemsYet")}</p>
                <Link className="search-page__cta" to="/inventory">
                  {t("search.goInventory")}
                </Link>
              </div>
            ) : null}

            {!isLoading && items.length > 0 && results.length === 0 ? (
              <div className="search-page__empty">
                <p>{t("search.noMatch")}</p>
                <button type="button" className="search-page__cta" onClick={clearAll}>
                  {t("search.clearFilters")}
                </button>
              </div>
            ) : null}

            {results.length > 0 ? (
              <ul className="search-page__list">
                {results.map((item) => {
                  const src = resolveMediaUrl(item.imageUrl);
                  const days = daysUntilExpiration(item.expirationDate);
                  return (
                    <li key={item.id}>
                      <Link to={`/inventory/${item.id}`} className="search-page__row">
                        <span className="search-page__thumb" aria-hidden>
                          {src ? <img src={src} alt="" /> : null}
                        </span>
                        <span className="search-page__row-main">
                          <span className="search-page__row-name">{item.name}</span>
                          <span className="search-page__row-meta">
                            {folderLabel(folders, item.folderId)}
                            {item.location?.trim() ? ` · ${item.location.trim()}` : ""}
                            {parsePrice(item.price) !== null
                              ? ` · ${formatMoney(parsePrice(item.price)!)}`
                              : ""}
                          </span>
                          {item.tags.length > 0 ? (
                            <span className="search-page__row-tags">
                              {item.tags.map((tag) => (
                                <span key={tag}>{tag}</span>
                              ))}
                            </span>
                          ) : null}
                        </span>
                        {days === null ? (
                          <span
                            className="search-page__expiry is-none"
                            data-tooltip={t("search.noExpiry")}
                            aria-label={t("search.noExpiry")}
                          >
                            <svg
                              className="search-page__expiry-icon"
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden
                            >
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <line x1="16" y1="2" x2="16" y2="6" />
                              <line x1="8" y1="2" x2="8" y2="6" />
                              <line x1="3" y1="10" x2="21" y2="10" />
                              <line x1="9" y1="15" x2="15" y2="15" />
                            </svg>
                          </span>
                        ) : (
                          <span
                            className={`search-page__expiry${
                              days < 0 ? " is-overdue" : ""
                            }${days >= 0 && days <= threshold ? " is-soon" : ""}`}
                          >
                            {expirationLabel(item.expirationDate)}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
