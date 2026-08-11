import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
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
        label: `Search: ${filters.query.trim()}`,
        onRemove: () => {
          setQueryText("");
          setFilters((p) => ({ ...p, query: "" }));
        },
      });
    }
    for (const id of filters.folderIds) {
      chips.push({
        key: `folder-${id}`,
        label: `Folder: ${describeFolderFilter(folders, id)}`,
        onRemove: () => setFilters((p) => ({ ...p, folderIds: p.folderIds.filter((f) => f !== id) })),
      });
    }
    for (const tag of filters.tags) {
      chips.push({
        key: `tag-${tag}`,
        label: `Tag: ${tag}`,
        onRemove: () => setFilters((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) })),
      });
    }
    for (const cat of filters.categories) {
      chips.push({
        key: `cat-${cat}`,
        label: `Category: ${cat}`,
        onRemove: () =>
          setFilters((p) => ({ ...p, categories: p.categories.filter((c) => c !== cat) })),
      });
    }
    for (const loc of filters.locations) {
      chips.push({
        key: `loc-${loc}`,
        label: `Location: ${loc === NO_LOCATION_KEY ? "No location" : loc}`,
        onRemove: () =>
          setFilters((p) => ({ ...p, locations: p.locations.filter((l) => l !== loc) })),
      });
    }
    if (filters.minPrice !== null) {
      chips.push({
        key: "min",
        label: `Min ${formatMoney(filters.minPrice)}`,
        onRemove: () => {
          setMinText("");
          setFilters((p) => ({ ...p, minPrice: null }));
        },
      });
    }
    if (filters.maxPrice !== null) {
      chips.push({
        key: "max",
        label: `Max ${formatMoney(filters.maxPrice)}`,
        onRemove: () => {
          setMaxText("");
          setFilters((p) => ({ ...p, maxPrice: null }));
        },
      });
    }
    if (filters.expiration !== "any") {
      const labels: Record<ExpirationFilter, string> = {
        any: "Any",
        has: "Has expiration",
        missing: "Missing expiration",
        expiring: "Expiring soon",
        overdue: "Overdue",
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
        label: filters.hasPhoto === "yes" ? "Has photo" : "No photo",
        onRemove: () => setFilters((p) => ({ ...p, hasPhoto: "any" })),
      });
    }
    return chips;
  }, [filters, folders]);

  const sortOptions: { value: SearchSort; label: string }[] = filters.query.trim()
    ? [
        { value: "relevance", label: "Relevance" },
        { value: "name", label: "Name" },
        { value: "price", label: "Price" },
        { value: "expiry", label: "Expiration" },
      ]
    : [
        { value: "name", label: "Name" },
        { value: "price", label: "Price" },
        { value: "expiry", label: "Expiration" },
      ];

  return (
    <AppShell>
      <div className="search-page">
        <header className="search-page__header">
          <div className="search-page__heading">
            <h1 className="search-page__title">Search</h1>
            <p className="search-page__subtitle">
              Find anything in your inventory. Type to search, then refine with filters. Results update
              live.
            </p>
          </div>
        </header>

        <div className="search-page__bar">
          <label className="search-page__query">
            <span className="search-page__query-label">Search</span>
            <input
              type="search"
              value={queryText}
              onChange={(e) => {
                const next = e.target.value;
                setQueryText(next);
                if (next.trim() && sort === "name") setSort("relevance");
                if (!next.trim() && sort === "relevance") setSort("name");
              }}
              placeholder="Search name, tag, location, folder…"
              autoComplete="off"
              spellCheck={false}
            />
            {queryText ? (
              <button
                type="button"
                className="search-page__query-clear"
                aria-label="Clear search"
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
          <div className="search-page__chips" aria-label="Active filters">
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
              Clear all
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
            {filtersOpen ? "Hide filters" : "Filters"}
            {hasActiveInventoryFilters(filters) ? " · on" : ""}
          </button>
        </div>

        <div className="search-page__grid">
          <aside
            className={`search-page__filters${filtersOpen ? " is-open" : ""}`}
            aria-label="Filters"
          >
            <section>
              <h2>Folders</h2>
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
                  Independent items
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
                  <p className="search-page__muted">No folders yet</p>
                ) : null}
              </div>
            </section>

            <section>
              <h2>Tags</h2>
              {tags.length === 0 ? (
                <p className="search-page__muted">No tags yet</p>
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
              <h2>Category</h2>
              <div className="search-page__scroll">
                {categories.length === 0 ? (
                  <p className="search-page__muted">No categories yet</p>
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
                      {cat}
                    </label>
                  ))
                )}
              </div>
            </section>

            <section>
              <h2>Location</h2>
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
                  No location
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
              <h2>Price</h2>
              <div className="search-page__price-fields">
                <TextField
                  label="Min"
                  type="number"
                  min={0}
                  step="0.01"
                  value={minText}
                  onChange={(e) => setMinText(e.target.value)}
                />
                <TextField
                  label="Max"
                  type="number"
                  min={0}
                  step="0.01"
                  value={maxText}
                  onChange={(e) => setMaxText(e.target.value)}
                />
              </div>
              <p className="search-page__muted">
                Items without a price are excluded when min or max is set.
              </p>
            </section>

            <section>
              <h2>Expiration</h2>
              <label className="search-page__select">
                <span className="search-page__select-label">Status</span>
                <select
                  value={filters.expiration}
                  onChange={(e) =>
                    setFilters((p) => ({
                      ...p,
                      expiration: e.target.value as ExpirationFilter,
                    }))
                  }
                >
                  <option value="any">Any</option>
                  <option value="has">Has date</option>
                  <option value="missing">Missing date</option>
                  <option value="expiring">Expiring soon (≤{threshold}d)</option>
                  <option value="overdue">Overdue</option>
                </select>
              </label>
            </section>

            <section>
              <h2>Photo</h2>
              <label className="search-page__select">
                <span className="search-page__select-label">Has photo</span>
                <select
                  value={filters.hasPhoto}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, hasPhoto: e.target.value as PhotoFilter }))
                  }
                >
                  <option value="any">Any</option>
                  <option value="yes">Has photo</option>
                  <option value="no">No photo</option>
                </select>
              </label>
            </section>
          </aside>

          <section className="search-page__results" aria-live="polite">
            <div className="search-page__results-toolbar">
              <p className="search-page__count">
                {isLoading
                  ? "Loading…"
                  : `Showing ${results.length} of ${items.length} item${items.length === 1 ? "" : "s"}`}
              </p>
              <label className="search-page__sort">
                <span>Sort</span>
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
                <p>No items yet. Add some in Inventory.</p>
                <Link className="search-page__cta" to="/inventory">
                  Go to Inventory
                </Link>
              </div>
            ) : null}

            {!isLoading && items.length > 0 && results.length === 0 ? (
              <div className="search-page__empty">
                <p>No items match. Try a different search or clear filters.</p>
                <button type="button" className="search-page__cta" onClick={clearAll}>
                  Clear filters
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
                            data-tooltip="No expiry"
                            aria-label="No expiry"
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
