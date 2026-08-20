import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout/AppShell";
import { ConfirmDeleteModal } from "../components/inventory/ConfirmDeleteModal";
import { Banner } from "../components/ui/Banner";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { TextField } from "../components/ui/TextField";
import { defaultLocationPresetsForLanguage } from "../constants/inventory";
import { currentLanguage } from "../i18n";
import { translateError } from "../i18n/apiErrors";
import { useEnsureInventory } from "../hooks/useEnsureInventory";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { toastSuccess } from "../store/toastStore";
import { buildManagedLocationRows } from "../utils/inventoryFilters";
import "./LocationsPage.scss";

export default function LocationsPage() {
  useEnsureInventory();
  const { t } = useTranslation();
  const household = useHouseholdStore((s) => s.household);
  const updateLocationPresets = useHouseholdStore((s) => s.updateLocationPresets);
  const items = useInventoryStore((s) => s.items);
  const updateItem = useInventoryStore((s) => s.updateItem);
  const isLoading = useInventoryStore((s) => s.isLoading);

  const presets = household?.locationPresets ?? defaultLocationPresetsForLanguage(currentLanguage());

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
      setError(t("errors.locationNameRequired"));
      return;
    }
    if (trimmed.length > 80) {
      setError(t("errors.locationMax"));
      return;
    }
    if (presets.some((loc) => loc.toLowerCase() === trimmed.toLowerCase())) {
      setError(t("errors.locationExists"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await savePresets([...presets, trimmed]);
      toastSuccess(t("locations.added", { name: trimmed }));
      setAdding(false);
      setNextName("");
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.couldNotAddLocation");
      setError(translateError(raw, t));
    } finally {
      setBusy(false);
    }
  };

  const renameLocation = async () => {
    if (!editingLocation) return;
    const trimmed = nextName.trim();
    if (!trimmed) {
      setError(t("errors.locationNameRequired"));
      return;
    }
    if (trimmed.length > 80) {
      setError(t("errors.locationMax"));
      return;
    }
    if (
      trimmed.toLowerCase() !== editingLocation.toLowerCase() &&
      presets.some((loc) => loc.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError(t("errors.locationExists"));
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
      toastSuccess(t("locations.renamed", { from: editingLocation, to: trimmed }));
      setEditingLocation(null);
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.couldNotRenameLocation");
      setError(translateError(raw, t));
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
    toastSuccess(t("locations.deleted", { name: removed }));
  };

  return (
    <AppShell>
      <div className="locations-page">
        <header className="locations-page__header">
          <div className="locations-page__heading">
            <h1>{t("locations.title")}</h1>
            <p>{t("locations.subtitle")}</p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setAdding(true);
              setNextName("");
              setError(null);
            }}
          >
            {t("locations.add")}
          </Button>
        </header>

        {isLoading && !household ? <p className="locations-page__muted">{t("locations.loading")}</p> : null}

        {!isLoading && rows.length === 0 ? (
          <div className="locations-page__empty">
            <p>{t("locations.empty")}</p>
            <Button
              type="button"
              onClick={() => {
                setAdding(true);
                setNextName("");
                setError(null);
              }}
            >
              {t("locations.add")}
            </Button>
            <Link className="locations-page__link" to="/inventory">
              {t("locations.goInventory")}
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
                      {t("common.item", { count: row.itemCount })}
                    </span>
                    {row.orphan ? <span className="locations-page__badge">{t("locations.inUseOnly")}</span> : null}
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
                    {t("common.edit")}
                  </button>
                  <button
                    type="button"
                    className="locations-page__action locations-page__action--danger"
                    onClick={() => setDeletingLocation(row.location)}
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <Modal
        title={adding ? t("locations.add") : t("locations.edit")}
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
            label={t("locations.name")}
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
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={adding ? addLocation : renameLocation}
              disabled={busy}
            >
              {busy ? t("common.saving") : adding ? t("common.add") : t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDeleteModal
        isOpen={!!deletingLocation}
        title={t("locations.deleteTitle")}
        message={t("locations.deleteMessage", { name: deletingLocation })}
        confirmLabel={t("common.delete")}
        onClose={() => setDeletingLocation(null)}
        onConfirm={deleteLocation}
      />
    </AppShell>
  );
}
