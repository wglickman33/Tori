import { useEffect, useState } from "react";
import { FOLDER_CATEGORIES } from "../../constants/inventory";
import type { Folder, FolderInput, Item } from "../../api/client";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { TextField } from "../ui/TextField";
import "./InventoryForms.scss";

interface MoveItemModalProps {
  isOpen: boolean;
  item: Item | null;
  folders: Folder[];
  onClose: () => void;
  onMove: (folderId: string | null) => Promise<void>;
  onCreateFolder: (body: FolderInput) => Promise<Folder>;
}

export function MoveItemModal({
  isOpen,
  item,
  folders,
  onClose,
  onMove,
  onCreateFolder,
}: MoveItemModalProps) {
  const [folderId, setFolderId] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderCategory, setNewFolderCategory] = useState<string>(FOLDER_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;
    setFolderId(item.folderId ?? "");
    setCreatingFolder(false);
    setNewFolderName("");
    setNewFolderCategory(FOLDER_CATEGORIES[0]);
    setCustomCategory("");
    setError(null);
    setLoading(false);
  }, [isOpen, item]);

  const startCreateFolder = () => {
    setCreatingFolder(true);
    setError(null);
  };

  const cancelCreateFolder = () => {
    setCreatingFolder(false);
    setError(null);
  };

  const handleMove = async () => {
    if (!item) return;
    setError(null);
    setLoading(true);
    try {
      let next: string | null = folderId || null;

      if (creatingFolder) {
        const resolvedCategory =
          newFolderCategory === "Custom" ? customCategory.trim() : newFolderCategory;
        if (!newFolderName.trim()) {
          setError("Folder name is required");
          setLoading(false);
          return;
        }
        if (!resolvedCategory) {
          setError("Category is required");
          setLoading(false);
          return;
        }
        const created = await onCreateFolder({
          name: newFolderName.trim(),
          category: resolvedCategory,
          creationDate: null,
        });
        next = created.id;
      } else if (next === (item.folderId ?? null)) {
        onClose();
        return;
      }

      await onMove(next);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not move item");
    } finally {
      setLoading(false);
    }
  };

  const primaryLabel = creatingFolder
    ? loading
      ? "Creating…"
      : "Create & move"
    : loading
      ? "Moving…"
      : "Move item";

  return (
    <Modal title="Move item" isOpen={isOpen} onClose={onClose}>
      <div className="inventory-form">
        {item ? (
          <p className="inventory-form__intro">
            Choose where <strong>{item.name}</strong> should live.
          </p>
        ) : null}
        {error ? <Banner>{error}</Banner> : null}

        {creatingFolder ? (
          <>
            <TextField
              label="New folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              required
              autoFocus
            />
            <label className="inventory-form__field">
              <span>Category</span>
              <select
                value={newFolderCategory}
                onChange={(e) => setNewFolderCategory(e.target.value)}
              >
                {FOLDER_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            {newFolderCategory === "Custom" ? (
              <TextField
                label="Custom category"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            ) : null}
            <p className="inventory-form__hint">
              We’ll create this folder, then move the item into it.{" "}
              <button
                type="button"
                className="inventory-form__text-btn"
                onClick={cancelCreateFolder}
                disabled={loading}
              >
                Choose an existing folder instead
              </button>
            </p>
          </>
        ) : (
          <>
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
            <p className="inventory-form__hint">
              Independent items sit outside any folder.{" "}
              <button
                type="button"
                className="inventory-form__text-btn"
                onClick={startCreateFolder}
                disabled={loading}
              >
                Create a new folder
              </button>
            </p>
          </>
        )}

        <div className="inventory-form__actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleMove()} disabled={loading || !item}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
