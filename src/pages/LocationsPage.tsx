import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TextField } from "../components/ui/TextField";
import { DEFAULT_LOCATION_PRESETS } from "../constants/inventory";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { toastSuccess } from "../store/toastStore";
import { buildManagedLocationRows } from "../utils/inventoryFilters";
import "./LocationsPage.scss";

export default function LocationsPage() {
  useEnsureInventory();
  const household = useHouseholdStore((s) => s.household);
  const updateLocationPresets = useHouseholdStore((s) => s.updateLocationPresets);
  const items = useInventoryStore((s) => s.items);
  const updateItem = useInventoryStore((s) => s.updateItem);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const presets = household?.locationPresets ?? [...DEFAULT_LOCATION_PRESETS];

  const rows = useMemo(
    () => buildManagedLocationRows(household?.locationPresets ?? null, items),
    [household?.locationPresets, items]
  );

  const [adding, setAdding] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [nextName, setNextName] = useState("");
  const [deletingLocation, setDeletingLocation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const savePresets = async (nextPresets: string[]) => {
    await updateLocationPresets(nextPresets);
  };

  const addLocation = async () => {
    const trimmed = nextName.trim();
    if (!trimmed) {
      setError("Location name is required");
      return;
    }
    if (trimmed.length > 80) {
      setError("Location must be 80 characters or fewer");
      return;
    }
    if (presets.some((loc) => loc.toLowerCase() === trimmed.toLowerCase())) {
      setError("That location is already in your list");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await savePresets([...presets, trimmed]);
      toastSuccess(`Location “${trimmed}” added`);
      setAdding(false);
      setNextName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add location");
    } finally {
      setBusy(false);
    }
  };

  const renameLocation = async () => {
    if (!editingLocation) return;
    const trimmed = nextName.trim();
    if (!trimmed) {
      setError("Location name is required");
      return;
    }
    if (trimmed.length > 80) {
      setError("Location must be 80 characters or fewer");
      return;
    }
    if (
      trimmed.toLowerCase() !== editingLocation.toLowerCase() &&
      presets.some((loc) => loc.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError("That location is already in your list");
      return;
    }
    if (trimmed === editingLocation) {
      setEditingLocation(null);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const inPresets = presets.some((loc) => loc.toLowerCase() === editingLocation.toLowerCase());
      const nextPresets = inPresets
        ? presets.map((loc) => (loc === editingLocation ? trimmed : loc))
        : [...presets, trimmed];
      await savePresets(nextPresets);

      const targets = items.filter((item) => item.location?.trim() === editingLocation);
      if (targets.length > 0) {
        await Promise.all(targets.map((item) => updateItem(item.id, { location: trimmed })));
      }
      toastSuccess(`Location “${editingLocation}” renamed to “${trimmed}”`);
      setEditingLocation(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not rename location");
    } finally {
      setBusy(false);
    }
  };

  const deleteLocation = async () => {
    if (!deletingLocation) return;
    const removed = deletingLocation;
    const nextPresets = presets.filter(
      (loc) => loc.toLowerCase() !== deletingLocation.toLowerCase()
    );
    await savePresets(nextPresets);
    const targets = items.filter((item) => item.location?.trim() === deletingLocation);
    if (targets.length > 0) {
      await Promise.all(targets.map((item) => updateItem(item.id, { location: null })));
    }
    toastSuccess(`Location “${removed}” deleted`);
  };

  return (
    <AppShell>
      <div className="locations-page">
        <header className="locations-page__header">
          <div className="locations-page__heading">
            <h1>Locations</h1>
            <p>
              Manage the location list used when adding items. Edit renames everywhere it is used;
              Delete removes it from the list and clears it from items.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setAdding(true);
              setNextName("");
              setError(null);
            }}
          >
            Add location
          </Button>
        </header>

        {isLoading && !household ? <p className="locations-page__muted">Loading locations…</p> : null}

        {!isLoading && rows.length === 0 ? (
          <div className="locations-page__empty">
            <p>No locations in your list yet. Add one to use it on items.</p>
            <Button
              type="button"
              onClick={() => {
                setAdding(true);
                setNextName("");
                setError(null);
              }}
            >
              Add location
            </Button>
            <Link className="locations-page__link" to="/inventory">
              Go to Inventory
            </Link>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <ul className="locations-page__list">
            {rows.map((row) => (
              <li key={row.location} className="locations-page__row">
                <div className="locations-page__row-main">
                  <span className="locations-page__name">{row.location}</span>
                  <span className="locations-page__meta">
                    <span className="locations-page__count">
                      {row.itemCount} {row.itemCount === 1 ? "item" : "items"}
                    </span>
                    {row.orphan ? <span className="locations-page__badge">In use only</span> : null}
                  </span>
                </div>
                <div className="locations-page__actions">
                  <button
                    type="button"
                    className="locations-page__action"
                    onClick={() => {
                      setEditingLocation(row.location);
                      setNextName(row.location);
                      setError(null);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="locations-page__action locations-page__action--danger"
                    onClick={() => setDeletingLocation(row.location)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Modal
        title={adding ? "Add location" : "Edit location"}
        isOpen={adding || !!editingLocation}
        onClose={() => {
          setAdding(false);
          setEditingLocation(null);
          setError(null);
        }}
      >
        <div className="locations-page__modal">
          {error ? <Banner>{error}</Banner> : null}
          <TextField
            label="Location name"
            value={nextName}
            onChange={(e) => setNextName(e.target.value)}
            maxLength={80}
            autoFocus
          />
          <div className="locations-page__modal-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setAdding(false);
                setEditingLocation(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={adding ? addLocation : renameLocation}
              disabled={busy}
            >
              {busy ? "Saving…" : adding ? "Add" : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deletingLocation}
        title="Delete location?"
        message={`Delete “${deletingLocation}” from your location list? It will also be cleared from every item that uses it.`}
        confirmLabel="Delete"
        onClose={() => setDeletingLocation(null)}
        onConfirm={deleteLocation}
      />
    </AppShell>
  );
}
