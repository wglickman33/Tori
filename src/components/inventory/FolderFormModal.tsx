import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { FOLDER_CATEGORIES } from "../../constants/inventory";
import type { Folder, FolderInput } from "../../api/client";
import { translateError } from "../../i18n/apiErrors";
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
  const { t } = useTranslation();
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
      setError(t("errors.folderNameRequired"));
      return;
    }
    if (!resolvedCategory) {
      setError(t("errors.categoryRequired"));
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
      const raw = err instanceof Error ? err.message : t("errors.couldNotSaveFolder");
      setError(translateError(raw, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={folder ? t("inventory.editFolder") : t("inventory.addFolder")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form className="inventory-form" onSubmit={handleSubmit} noValidate>
        {error ? <Banner>{error}</Banner> : null}
        <TextField
          label={t("inventory.name")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label className="inventory-form__field">
          <span>{t("inventory.category")}</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {FOLDER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`categories.${c}`, { defaultValue: c })}
              </option>
            ))}
          </select>
        </label>
        {category === "Custom" ? (
          <TextField
            label={t("inventory.customCategory")}
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
          />
        ) : null}
        <TextField
          label={t("inventory.creationDate")}
          type="date"
          value={creationDate}
          onChange={(e) => setCreationDate(e.target.value)}
        />
        <div className="inventory-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t("common.saving") : folder ? t("inventory.saveChanges") : t("inventory.addFolder")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
