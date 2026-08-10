import { useEffect, useState, type FormEvent } from "react";
import { FOLDER_CATEGORIES } from "../../constants/inventory";
import type { Folder, FolderInput } from "../../api/client";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { TextField } from "../ui/TextField";
import "./InventoryForms.scss";

interface FolderFormModalProps {
  isOpen: boolean;
  folder?: Folder | null;
  onClose: () => void;
  onSubmit: (body: FolderInput) => Promise<void>;
}

export function FolderFormModal({ isOpen, folder, onClose, onSubmit }: FolderFormModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(FOLDER_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(folder?.name ?? "");
    const known = FOLDER_CATEGORIES.includes(folder?.category as (typeof FOLDER_CATEGORIES)[number]);
    setCategory(known ? (folder?.category as string) : folder?.category ? "Custom" : FOLDER_CATEGORIES[0]);
    setCustomCategory(known ? "" : folder?.category ?? "");
    setCreationDate(folder?.creationDate ?? "");
    setError(null);
  }, [folder, isOpen]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const resolvedCategory = category === "Custom" ? customCategory.trim() : category;
    if (!name.trim()) {
      setError("Folder name is required");
      return;
    }
    if (!resolvedCategory) {
      setError("Category is required");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        category: resolvedCategory,
        creationDate: creationDate || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save folder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={folder ? "Edit folder" : "Add folder"} isOpen={isOpen} onClose={onClose}>
      <form className="inventory-form" onSubmit={handleSubmit} noValidate>
        {error ? <Banner>{error}</Banner> : null}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <label className="inventory-form__field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {FOLDER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {category === "Custom" ? (
          <TextField
            label="Custom category"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />
        ) : null}
        <TextField
          label="Creation date"
          type="date"
          value={creationDate}
          onChange={(e) => setCreationDate(e.target.value)}
        />
        <div className="inventory-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving…" : folder ? "Save changes" : "Add folder"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
