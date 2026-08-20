import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { resolveMediaUrl } from "../../api/client";
import { translateError } from "../../i18n/apiErrors";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import "./ItemImageControls.scss";

const MAX_BYTES = 5 * 1024 * 1024;

interface ItemImageControlsProps {
  imageUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  /** When true, show that photo changes save right away. */
  immediate?: boolean;
}

export function ItemImageControls({
  imageUrl,
  onUpload,
  onRemove,
  immediate = false,
}: ItemImageControlsProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = resolveMediaUrl(imageUrl);

  const pick = () => inputRef.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError(t("errors.jpegPngWebp"));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t("errors.imageTooLarge"));
      return;
    }
    setBusy(true);
    try {
      await onUpload(file);
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.uploadFailed");
      setError(translateError(raw, t));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    setError(null);
    setBusy(true);
    try {
      await onRemove();
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.couldNotRemovePhoto");
      setError(translateError(raw, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="item-image-controls">
      <h3>{t("inventory.photo")}</h3>
      {error ? <Banner>{error}</Banner> : null}
      {preview ? (
        <img src={preview} alt={t("inventory.itemAlt")} className="item-image-controls__preview" />
      ) : (
        <p className="item-image-controls__empty">{t("inventory.photoEmpty")}</p>
      )}
      {immediate ? (
        <p className="item-image-controls__hint">{t("inventory.photoSavesImmediately")}</p>
      ) : null}
      <div className="item-image-controls__actions">
        <Button type="button" variant="secondary" onClick={pick} disabled={busy}>
          {preview ? t("inventory.replacePhoto") : t("inventory.addPhoto")}
        </Button>
        {preview ? (
          <Button type="button" variant="ghost" onClick={remove} disabled={busy}>
            {t("inventory.removePhoto")}
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
    </div>
  );
}
