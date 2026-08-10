import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { TextField } from "../components/ui/TextField";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useInventoryStore } from "../store/inventoryStore";
import {
  INDEPENDENT_FOLDER_KEY,
  collectTags,
  daysUntilExpiration,
  filterItems,
  folderLabel,
  uniqueSorted,
  type SearchFilters,
} from "../utils/inventoryFilters";
import "./SearchPage.scss";

const emptyFilters = (): SearchFilters => ({
  folderIds: [],
  names: [],
  tags: [],
  minPrice: null,
  maxPrice: null,
});

export default function SearchPage() {
  useEnsureInventory();
  const folders = useInventoryStore((s) => s.folders);
  const items = useInventoryStore((s) => s.items);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const [draft, setDraft] = useState<SearchFilters>(emptyFilters);
  const [minText, setMinText] = useState("");
  const [maxText, setMaxText] = useState("");
  const [applied, setApplied] = useState<SearchFilters | null>(null);

  const names = useMemo(() => uniqueSorted(items.map((i) => i.name)), [items]);
  const tags = useMemo(() => collectTags(items), [items]);

  const results = useMemo(
    () => (applied ? filterItems(items, applied) : []),
    [applied, items]
  );

  const toggle = (key: "folderIds" | "names" | "tags", value: string) => {
    setDraft((prev) => {
      const list = prev[key];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [key]: next };
    });
  };

  const apply = () => {
    const minPrice = minText === "" ? null : Number(minText);
    const maxPrice = maxText === "" ? null : Number(maxText);
    setApplied({
      ...draft,
      minPrice: minPrice !== null && Number.isFinite(minPrice) ? minPrice : null,
      maxPrice: maxPrice !== null && Number.isFinite(maxPrice) ? maxPrice : null,
    });
  };

  const clear = () => {
    setDraft(emptyFilters());
    setMinText("");
    setMaxText("");
    setApplied(null);
  };

  return (
    <AppShell>
      <div className="search-page">
        <header className="search-page__header">
          <div>
            <h1>Search</h1>
            <p>Filter by folder, name, tag, and price. All groups combine with AND.</p>
          </div>
          <div className="search-page__header-actions">
            <Button type="button" variant="ghost" onClick={clear}>
              Clear filters
            </Button>
            <Button type="button" onClick={apply}>
              Apply filters
            </Button>
          </div>
        </header>

        <div className="search-page__grid">
          <aside className="search-page__filters">
            <section>
              <h2>Folders</h2>
              <label className="search-page__check">
                <input
                  type="checkbox"
                  checked={draft.folderIds.includes(INDEPENDENT_FOLDER_KEY)}
                  onChange={() => toggle("folderIds", INDEPENDENT_FOLDER_KEY)}
                />
                Independent items
              </label>
              {folders.map((folder) => (
                <label key={folder.id} className="search-page__check">
                  <input
                    type="checkbox"
                    checked={draft.folderIds.includes(folder.id)}
                    onChange={() => toggle("folderIds", folder.id)}
                  />
                  {folder.name}
                </label>
              ))}
              {folders.length === 0 ? <p className="search-page__muted">No folders yet</p> : null}
            </section>

            <section>
              <h2>Names</h2>
              {names.length === 0 ? (
                <p className="search-page__muted">No names yet</p>
              ) : (
                names.map((name) => (
                  <label key={name} className="search-page__check">
                    <input
                      type="checkbox"
                      checked={draft.names.includes(name)}
                      onChange={() => toggle("names", name)}
                    />
                    {name}
                  </label>
                ))
              )}
            </section>

            <section>
              <h2>Tags</h2>
              {tags.length === 0 ? (
                <p className="search-page__muted">No tags yet</p>
              ) : (
                tags.map((tag) => (
                  <label key={tag} className="search-page__check">
                    <input
                      type="checkbox"
                      checked={draft.tags.includes(tag)}
                      onChange={() => toggle("tags", tag)}
                    />
                    {tag}
                  </label>
                ))
              )}
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
              <p className="search-page__muted">Items without a price are excluded when min or max is set.</p>
            </section>
          </aside>

          <section className="search-page__results">
            {isLoading ? <p>Loading inventory…</p> : null}

            {!isLoading && items.length === 0 ? (
              <div className="search-page__empty">
                <p>No items yet — add some in Inventory.</p>
                <Link className="search-page__cta" to="/inventory">
                  Go to Inventory
                </Link>
              </div>
            ) : null}

            {!isLoading && items.length > 0 && !applied ? (
              <p className="search-page__muted">Choose filters and click Apply to see results.</p>
            ) : null}

            {!isLoading && applied && results.length === 0 ? (
              <p>No items match your filters.</p>
            ) : null}

            {applied && results.length > 0 ? (
              <div className="search-page__table-wrap">
                <table className="search-page__table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Folder</th>
                      <th>Tags</th>
                      <th>Price</th>
                      <th>Days until expiration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((item) => {
                      const days = daysUntilExpiration(item.expirationDate);
                      return (
                        <tr key={item.id}>
                          <td>
                            <Link to={`/inventory/${item.id}`}>{item.name}</Link>
                          </td>
                          <td>{folderLabel(folders, item.folderId)}</td>
                          <td>{item.tags.length ? item.tags.join(", ") : "—"}</td>
                          <td>{item.price ? `$${item.price}` : "—"}</td>
                          <td>
                            {days === null ? "—" : days < 0 ? "Overdue" : days}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
