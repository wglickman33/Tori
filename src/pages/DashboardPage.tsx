import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { WhiskCrossLink } from "../components/ui/WhiskCrossLink";
import { downloadHouseholdCsv } from "../utils/exportCsv";
import { computeDashboardStats } from "../utils/inventoryFilters";
import "./DashboardPage.scss";

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function DashboardPage() {
  useEnsureInventory();
  const householdId = useHouseholdStore((s) => s.household?.id);
  const folders = useInventoryStore((s) => s.folders);
  const items = useInventoryStore((s) => s.items);
  const isLoading = useInventoryStore((s) => s.isLoading);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const stats = useMemo(() => computeDashboardStats(folders, items), [folders, items]);

  const onExport = async () => {
    if (!householdId) return;
    setExportError(null);
    setExporting(true);
    try {
      await downloadHouseholdCsv(householdId);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const valueCopy =
    stats.itemCount === 0
      ? "No items yet"
      : stats.itemsMissingPrice === stats.itemCount
        ? "Add values to see your total"
        : stats.itemsMissingPrice > 0
          ? `${formatMoney(stats.totalValue)} · excluding ${stats.itemsMissingPrice} without price`
          : formatMoney(stats.totalValue);

  return (
    <AppShell>
      <div className="dashboard-page">
        <header className="dashboard-page__header">
          <div>
            <h1>Dashboard</h1>
            <p>Household totals from your inventory.</p>
          </div>
          <Button type="button" variant="secondary" onClick={onExport} disabled={exporting || !householdId}>
            {exporting ? "Exporting…" : "Export CSV"}
          </Button>
        </header>

        {exportError ? <Banner>{exportError}</Banner> : null}
        {isLoading ? <p className="dashboard-page__status">Loading dashboard…</p> : null}
        {!isLoading && stats.itemCount === 0 ? (
          <div className="dashboard-page__empty">
            <p>No items yet. Add folders and items in Inventory to see totals.</p>
            <Link to="/inventory" className="dashboard-page__empty-link">
              Go to Inventory
            </Link>
          </div>
        ) : null}

        <div className="dashboard-page__grid">
          <Link to="/inventory" className="dashboard-card">
            <span className="dashboard-card__label">Folders</span>
            <span className="dashboard-card__value">{stats.folderCount}</span>
            <span className="dashboard-card__hint">Open inventory</span>
          </Link>

          <Link to="/inventory" className="dashboard-card">
            <span className="dashboard-card__label">Items</span>
            <span className="dashboard-card__value">{stats.itemCount}</span>
            <span className="dashboard-card__hint">Open inventory</span>
          </Link>

          <div className="dashboard-card dashboard-card--static">
            <span className="dashboard-card__label">Total quantity</span>
            <span className="dashboard-card__value">{stats.totalQuantity}</span>
            <span className="dashboard-card__hint">Sum of item quantities</span>
          </div>

          <div className="dashboard-card dashboard-card--static">
            <span className="dashboard-card__label">Total value</span>
            <span className="dashboard-card__value dashboard-card__value--text">{valueCopy}</span>
            <span className="dashboard-card__hint">Based on item prices</span>
          </div>

          <Link to="/expiring" className="dashboard-card">
            <span className="dashboard-card__label">Expiring soon</span>
            <span className="dashboard-card__value">{stats.expiringSoonCount}</span>
            <span className="dashboard-card__hint">Within 7 days or overdue · open expiring view</span>
          </Link>
        </div>

        <WhiskCrossLink />
      </div>
    </AppShell>
  );
}
