import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { InventoryTransferBar } from "../components/inventory/InventoryTransferBar";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import {
  computeInventoryValue,
  formatMoney,
  formatPercent,
  type ValueItemRow,
} from "../utils/inventoryValue";
import "./ValuePage.scss";

type PriceFilter = "all" | "priced" | "missing";
type SortKey = "name" | "folder" | "quantity" | "price" | "value";

function compareRows(a: ValueItemRow, b: ValueItemRow, key: SortKey, dir: 1 | -1): number {
  const mul = dir;
  switch (key) {
    case "name":
      return mul * a.item.name.localeCompare(b.item.name);
    case "folder":
      return mul * a.folderName.localeCompare(b.folderName);
    case "quantity":
      return mul * (a.quantity - b.quantity);
    case "price": {
      const av = a.price ?? -1;
      const bv = b.price ?? -1;
      return mul * (av - bv);
    }
    case "value": {
      const av = a.lineValue ?? -1;
      const bv = b.lineValue ?? -1;
      return mul * (av - bv);
    }
    default:
      return 0;
  }
}

export default function ValuePage() {
  useEnsureInventory();
  const household = useHouseholdStore((s) => s.household);
  const folders = useInventoryStore((s) => s.folders);
  const items = useInventoryStore((s) => s.items);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const [priceFilter, setPriceFilter] = useState<PriceFilter>("all");
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("value");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const summary = useMemo(() => computeInventoryValue(folders, items), [folders, items]);

  const filteredRows = useMemo(() => {
    let rows = summary.rows;
    if (priceFilter === "priced") rows = rows.filter((r) => r.lineValue !== null);
    if (priceFilter === "missing") rows = rows.filter((r) => r.lineValue === null);
    if (folderFilter === "__independent__") {
      rows = rows.filter((r) => r.item.folderId === null);
    } else if (folderFilter !== "all") {
      rows = rows.filter((r) => r.item.folderId === folderFilter);
    }
    return [...rows].sort((a, b) => compareRows(a, b, sortKey, sortDir));
  }, [summary.rows, priceFilter, folderFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else {
      setSortKey(key);
      setSortDir(key === "name" || key === "folder" ? 1 : -1);
    }
  };

  const sortMark = (key: SortKey) => {
    if (sortKey !== key) return "";
    return sortDir === 1 ? " ↑" : " ↓";
  };

  const { coverage } = summary;

  return (
    <AppShell>
      <div className="value-page">
        <header className="value-page__header">
          <div className="value-page__heading">
            <h1 className="value-page__title">Value</h1>
            <p className="value-page__subtitle">
              Recorded inventory worth for {household?.name ?? "your household"}. Each line is unit
              price × quantity; items without a price are left out of the total.
            </p>
          </div>
          <InventoryTransferBar
            className="value-page__transfer"
            householdName={household?.name}
            folders={folders}
            items={items}
          />
        </header>

        {isLoading ? <p className="value-page__status">Loading value…</p> : null}

        {!isLoading && items.length === 0 ? (
          <div className="value-page__empty">
            <p>No items yet. Add inventory to track recorded value.</p>
            <Link to="/inventory" className="value-page__empty-link">
              Go to Inventory
            </Link>
          </div>
        ) : null}

        {items.length > 0 ? (
          <>
            <section className="value-hero" aria-label="Value summary">
              <div className="value-hero__card value-hero__card--primary">
                <span className="value-hero__label">Total recorded value</span>
                <span className="value-hero__value">
                  {coverage.pricedCount > 0 ? formatMoney(coverage.totalValue) : "-"}
                </span>
                <span className="value-hero__hint">Unit price × quantity for priced items</span>
              </div>
              <div className="value-hero__card">
                <span className="value-hero__label">Price coverage</span>
                <span className="value-hero__value">{formatPercent(coverage.pricedShare)}</span>
                <span className="value-hero__hint">
                  {coverage.pricedCount} of {coverage.itemCount} items priced
                </span>
              </div>
              <div className="value-hero__card">
                <span className="value-hero__label">Missing price</span>
                <span className="value-hero__value">{coverage.missingPriceCount}</span>
                <span className="value-hero__hint">These don’t count toward the total</span>
              </div>
            </section>

            <div className="value-page__split">
              <BreakdownPanel title="By folder" rows={summary.byFolder} />
              <BreakdownPanel title="By category" rows={summary.byCategory} />
              <BreakdownPanel title="By location" rows={summary.byLocation} />
            </div>

            <section className="value-table-panel" aria-labelledby="value-table-title">
              <div className="value-table-panel__header">
                <h2 id="value-table-title" className="value-table-panel__title">
                  Items
                </h2>
                <div className="value-table-panel__filters">
                  <div className="value-table-panel__seg" role="group" aria-label="Price filter">
                    {(
                      [
                        ["all", "All"],
                        ["priced", "Priced"],
                        ["missing", "Missing"],
                      ] as const
                    ).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        className={priceFilter === value ? "is-on" : undefined}
                        onClick={() => setPriceFilter(value)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <label className="value-table-panel__folder">
                    <span className="value-table-panel__folder-label">Folder</span>
                    <select
                      value={folderFilter}
                      onChange={(e) => setFolderFilter(e.target.value)}
                      aria-label="Filter by folder"
                    >
                      <option value="all">All folders</option>
                      <option value="__independent__">Independent</option>
                      {folders.map((folder) => (
                        <option key={folder.id} value={folder.id}>
                          {folder.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {filteredRows.length === 0 ? (
                <p className="value-page__status">No items match these filters.</p>
              ) : (
                <div className="value-table-wrap">
                  <table className="value-table">
                    <thead>
                      <tr>
                        <th>
                          <button type="button" onClick={() => toggleSort("name")}>
                            Item{sortMark("name")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => toggleSort("folder")}>
                            Folder{sortMark("folder")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => toggleSort("quantity")}>
                            Qty{sortMark("quantity")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => toggleSort("price")}>
                            Unit price{sortMark("price")}
                          </button>
                        </th>
                        <th>
                          <button type="button" onClick={() => toggleSort("value")}>
                            Value{sortMark("value")}
                          </button>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRows.map((row) => (
                        <tr key={row.item.id}>
                          <td>
                            <Link to={`/inventory/${row.item.id}`}>{row.item.name}</Link>
                          </td>
                          <td>{row.folderName}</td>
                          <td>{row.quantity}</td>
                          <td className={row.price === null ? "value-table__missing" : undefined}>
                            {row.price === null ? "-" : formatMoney(row.price)}
                          </td>
                          <td className={row.lineValue === null ? "value-table__missing" : undefined}>
                            {row.lineValue === null ? "-" : formatMoney(row.lineValue)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function BreakdownPanel({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; label: string; itemCount: number; totalValue: number; share: number }[];
}) {
  return (
    <section className="value-breakdown" aria-label={title}>
      <h2 className="value-breakdown__title">{title}</h2>
      {rows.length === 0 ? (
        <p className="value-breakdown__empty">No priced items yet.</p>
      ) : (
        <ul className="value-breakdown__list">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="value-breakdown__meta">
                <span>{row.label}</span>
                <span>
                  {formatMoney(row.totalValue)} · {row.itemCount}
                </span>
              </div>
              <div className="value-breakdown__track" aria-hidden>
                <div className="value-breakdown__fill" style={{ width: formatPercent(row.share) }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
