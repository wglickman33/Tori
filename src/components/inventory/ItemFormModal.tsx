import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Folder, Item, ItemInput } from "../../api/client";
import { defaultLocationPresetsForLanguage } from "../../constants/inventory";
import { currentLanguage } from "../../i18n";
import { translateError } from "../../i18n/apiErrors";
import { useHouseholdStore } from "../../store/householdStore";
import { useInventoryStore } from "../../store/inventoryStore";
import { buildLocationSelectOptions } from "../../utils/inventoryFilters";
import { collectLocations } from "../../utils/inventorySearchQuery";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { TextField } from "../ui/TextField";
import { ItemImageControls } from "./ItemImageControls";
import "./InventoryForms.scss";

const MAX_BYTES = 5 * 1024 * 1024;

interface ItemFormModalProps {
  isOpen: boolean;
  item?: Item | null;
  folders: Folder[];
  /** Prefills folder when creating a new item. */
  defaultFolderId?: string | null;
  onClose: () => void;
  onSubmit: (body: ItemInput, pendingImage?: File | null) => Promise<void>;
  onUploadImage?: (file: File) => Promise<void>;
  onRemoveImage?: () => Promise<void>;
}

function tagsToText(tags: string[] | undefined) {
  return (tags ?? []).join(", ");
}

function textToTags(value: string) {
  return value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function ItemFormModal({
  isOpen,
  item,
  folders,
  defaultFolderId = null,
  onClose,
  onSubmit,
  onUploadImage,
  onRemoveImage,
}: ItemFormModalProps) {
  const { t } = useTranslation();
  const items = useInventoryStore((s) => s.items);
  const locationPresets = useHouseholdStore((s) => s.household?.locationPresets);
  const updateLocationPresets = useHouseholdStore((s) => s.updateLocationPresets);
  const locationOptions = useMemo(
    () => buildLocationSelectOptions(locationPresets, collectLocations(items)),
    [locationPresets, items]
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [folderId, setFolderId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(item?.name ?? "");
    const current = item?.location?.trim() ?? "";
    const known = Boolean(current && locationOptions.includes(current) && current !== "Custom");
    setLocation(current ? (known ? current : "Custom") : "");
    setCustomLocation(known ? "" : current);
    setFolderId(item?.folderId ?? defaultFolderId ?? "");
    setQuantity(String(item?.quantity ?? 1));
    setPrice(item?.price ?? "");
    setPurchaseDate(item?.purchaseDate ?? "");
    setExpirationDate(item?.expirationDate ?? "");
    setTagsText(tagsToText(item?.tags));
    setPendingImage(null);
    setPendingPreview(null);
    setError(null);
  }, [isOpen, item, defaultFolderId, locationOptions]);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const onPendingFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("errors.jpegPngWebp"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("errors.imageTooLarge"));
      return;
    }
    setError(null);
    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    setPendingImage(file);
    setPendingPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(t("errors.itemNameRequired"));
      return;
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setError(t("errors.quantityMin"));
      return;
    }
    const resolvedLocation =
      location === "Custom" ? customLocation.trim() || null : location || null;
    setLoading(true);
    try {
      await onSubmit(
        {
          name: name.trim(),
          location: resolvedLocation,
          folderId: folderId || null,
          quantity: qty,
          price: price === "" ? null : price,
          purchaseDate: purchaseDate || null,
          expirationDate: expirationDate || null,
          tags: textToTags(tagsText),
        },
        pendingImage
      );
      // Keep household location list in sync when Custom introduces a new place.
      if (resolvedLocation) {
        const current = locationPresets ?? defaultLocationPresetsForLanguage(currentLanguage());
        const exists = current.some((loc) => loc.toLowerCase() === resolvedLocation.toLowerCase());
        if (!exists) {
          try {
            await updateLocationPresets([...current, resolvedLocation]);
          } catch {
            /* item saved; list sync can retry from Locations */
          }
        }
      }
      onClose();
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.couldNotSaveItem");
      setError(translateError(raw, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={item ? t("inventory.editItem") : t("inventory.addItem")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="inventory-form" onSubmit={handleSubmit} noValidate>
        {error ? <Banner>{error}</Banner> : null}
        <TextField label={t("inventory.name")} value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="inventory-form__row">
          <label className="inventory-form__field">
            <span>{t("inventory.location")}</span>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">{t("inventory.none")}</option>
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "Custom" ? t("common.custom") : loc}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory-form__field">
            <span>{t("inventory.folder")}</span>
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
              <option value="">{t("inventory.independentItem")}</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="inventory-form__hint">
          <Link to="/locations" className="inventory-form__inline-link">
            {t("inventory.manageLocations")}
          </Link>
        </p>
        {location === "Custom" ? (
          <TextField
            label={t("inventory.customLocation")}
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
            maxLength={80}
          />
        ) : null}
        <div className="inventory-form__row">
          <TextField
            label={t("common.quantity")}
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <TextField
            label={t("inventory.price")}
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="inventory-form__row">
          <TextField
            label={t("inventory.purchaseDate")}
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
          <TextField
            label={t("inventory.expirationDate")}
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>
        <TextField
          label={t("inventory.tags")}
          placeholder={t("inventory.tagsPlaceholder")}
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
        />
        <p className="inventory-form__hint">{t("inventory.tagsHint")}</p>
        {item && onUploadImage && onRemoveImage ? (
          <ItemImageControls
            imageUrl={item.imageUrl}
            onUpload={onUploadImage}
            onRemove={onRemoveImage}
            immediate
          />
        ) : (
          <div className="inventory-form__photo">
            <span>{t("inventory.photoOptional")}</span>
            {pendingPreview ? (
              <img
                src={pendingPreview}
                alt={t("inventory.selectedItemAlt")}
                className="inventory-form__photo-preview"
              />
            ) : null}
            <div className="inventory-form__photo-actions">
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                {pendingImage ? t("inventory.changePhoto") : t("inventory.addPhoto")}
              </Button>
              {pendingImage ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (pendingPreview) URL.revokeObjectURL(pendingPreview);
                    setPendingImage(null);
                    setPendingPreview(null);
                  }}
                >
                  {t("inventory.clearPhoto")}
                </Button>
              ) : null}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => onPendingFile(e.target.files?.[0])}
            />
          </div>
        )}
        <div className="inventory-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t("common.saving") : item ? t("inventory.saveChanges") : t("inventory.addItem")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
