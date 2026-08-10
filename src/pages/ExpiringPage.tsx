import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { TextField } from "../components/ui/TextField";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useInventoryStore } from "../store/inventoryStore";
import { folderLabel } from "../utils/inventoryFilters";
import {
  DEFAULT_EXPIRING_THRESHOLD,
  expirationLabel,
  filterExpiringItems,
  readExpiringThreshold,
  writeExpiringThreshold,
} from "../utils/expiring";
import "./ExpiringPage.scss";

export default function ExpiringPage() {
  useEnsureInventory();
  const folders = useInventoryStore((s) => s.folders);
  const items = useInventoryStore((s) => s.items);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const [threshold, setThreshold] = useState(() => readExpiringThreshold());
  const [thresholdText, setThresholdText] = useState(String(threshold));

  const expiring = useMemo(
    () => filterExpiringItems(items, threshold),
    [items, threshold]
  );

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
          <div>
            <h1>Expiring</h1>
            <p>Items at or past your warning window, most urgent first.</p>
          </div>
          <div className="expiring-page__threshold">
            <TextField
              label="Warn me N days before"
              type="number"
              min={0}
              max={365}
              value={thresholdText}
              onChange={(e) => setThresholdText(e.target.value)}
              onBlur={() => commitThreshold(thresholdText)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitThreshold(thresholdText);
              }}
            />
            <p className="expiring-page__hint">Default {DEFAULT_EXPIRING_THRESHOLD}. Use 0 for today and overdue only.</p>
          </div>
        </header>

        {isLoading ? <p className="expiring-page__status">Loading…</p> : null}

        {!isLoading && items.length === 0 ? (
          <div className="expiring-page__empty">
            <p>No items yet.</p>
            <Link to="/inventory" className="expiring-page__empty-link">
              Go to Inventory
            </Link>
          </div>
        ) : null}

        {!isLoading && items.length > 0 && expiring.length === 0 ? (
          <div className="expiring-page__empty">
            Nothing expiring within {threshold} day{threshold === 1 ? "" : "s"}.
          </div>
        ) : null}

        {expiring.length > 0 ? (
          <div className="expiring-page__table-wrap">
            <table className="expiring-page__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Folder</th>
                  <th>Expiration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {expiring.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link to={`/inventory/${item.id}`}>{item.name}</Link>
                    </td>
                    <td>{folderLabel(folders, item.folderId)}</td>
                    <td>{item.expirationDate || "—"}</td>
                    <td>
                      <span
                        className={`expiring-page__badge${
                          expirationLabel(item.expirationDate) === "Overdue"
                            ? " is-overdue"
                            : " is-soon"
                        }`}
                      >
                        {expirationLabel(item.expirationDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
