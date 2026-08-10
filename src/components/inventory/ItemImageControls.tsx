import { useRef, useState } from "react";
import { resolveMediaUrl } from "../../api/client";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import "./ItemImageControls.scss";

const MAX_BYTES = 5 * 1024 * 1024;

interface ItemImageControlsProps {
  imageUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function ItemImageControls({ imageUrl, onUpload, onRemove }: ItemImageControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const preview = resolveMediaUrl(imageUrl);

  const pick = () => inputRef.current?.click();

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, and WebP images are allowed");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5MB or smaller");
      return;
    }
    setBusy(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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
      setError(err instanceof Error ? err.message : "Could not remove photo");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="item-image-controls">
      <h3>Photo</h3>
      {error ? <Banner>{error}</Banner> : null}
      {preview ? (
        <img src={preview} alt="Item" className="item-image-controls__preview" />
      ) : (
        <p className="item-image-controls__empty">Add a photo so you’ll recognize this item.</p>
      )}
      <div className="item-image-controls__actions">
        <Button type="button" variant="secondary" onClick={pick} disabled={busy}>
          {preview ? "Replace photo" : "Add photo"}
        </Button>
        {preview ? (
          <Button type="button" variant="ghost" onClick={remove} disabled={busy}>
            Remove photo
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
