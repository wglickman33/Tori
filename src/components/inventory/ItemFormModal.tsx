import { useEffect, useRef, useState, type FormEvent } from "react";
import { ITEM_LOCATIONS } from "../../constants/inventory";
import type { Folder, Item, ItemInput } from "../../api/client";
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
  onClose,
  onSubmit,
  onUploadImage,
  onRemoveImage,
}: ItemFormModalProps) {
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
    const known = ITEM_LOCATIONS.includes(item?.location as (typeof ITEM_LOCATIONS)[number]);
    setLocation(item?.location ? (known ? item.location : "Custom") : "");
    setCustomLocation(known ? "" : item?.location ?? "");
    setFolderId(item?.folderId ?? "");
    setQuantity(String(item?.quantity ?? 1));
    setPrice(item?.price ?? "");
    setPurchaseDate(item?.purchaseDate ?? "");
    setExpirationDate(item?.expirationDate ?? "");
    setTagsText(tagsToText(item?.tags));
    setPendingImage(null);
    setPendingPreview(null);
    setError(null);
  }, [isOpen, item]);

  useEffect(() => {
    return () => {
      if (pendingPreview) URL.revokeObjectURL(pendingPreview);
    };
  }, [pendingPreview]);

  const onPendingFile = (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5MB or smaller");
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
      setError("Item name is required");
      return;
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      setError("Quantity must be a whole number of at least 1");
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
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={item ? "Edit item" : "Add item"} isOpen={isOpen} onClose={onClose}>
      <form className="inventory-form" onSubmit={handleSubmit} noValidate>
        {error ? <Banner>{error}</Banner> : null}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div className="inventory-form__row">
          <label className="inventory-form__field">
            <span>Location</span>
            <select value={location} onChange={(e) => setLocation(e.target.value)}>
              <option value="">None</option>
              {ITEM_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </label>
          <label className="inventory-form__field">
            <span>Folder</span>
            <select value={folderId} onChange={(e) => setFolderId(e.target.value)}>
              <option value="">Independent item</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {location === "Custom" ? (
          <TextField
            label="Custom location"
            value={customLocation}
            onChange={(e) => setCustomLocation(e.target.value)}
          />
        ) : null}
        <div className="inventory-form__row">
          <TextField
            label="Quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <TextField
            label="Price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="inventory-form__row">
          <TextField
            label="Purchase date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
          />
          <TextField
            label="Expiration date"
            type="date"
            value={expirationDate}
            onChange={(e) => setExpirationDate(e.target.value)}
          />
        </div>
        <TextField
          label="Tags"
          placeholder="pantry, snacks"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
        />
        <p className="inventory-form__hint">Separate tags with commas.</p>
        {item && onUploadImage && onRemoveImage ? (
          <ItemImageControls
            imageUrl={item.imageUrl}
            onUpload={onUploadImage}
            onRemove={onRemoveImage}
          />
        ) : (
          <div className="inventory-form__photo">
            <span>Photo (optional)</span>
            {pendingPreview ? (
              <img src={pendingPreview} alt="Selected item" className="inventory-form__photo-preview" />
            ) : null}
            <div className="inventory-form__photo-actions">
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                {pendingImage ? "Change photo" : "Add photo"}
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
                  Clear photo
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
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : item ? "Save changes" : "Add item"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
