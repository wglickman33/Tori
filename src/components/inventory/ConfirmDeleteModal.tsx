import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { translateError } from "../../i18n/apiErrors";
import { Banner } from "../ui/Banner";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import "./InventoryForms.scss";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setLoading(false);
  }, [isOpen]);

  const handleConfirm = async () => {
    setError(null);
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      const raw = err instanceof Error ? err.message : t("errors.deleteFailed");
      setError(translateError(raw, t));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose}>
      <div className="inventory-form">
        <p className="inventory-form__intro">{message}</p>
        {error ? <Banner>{error}</Banner> : null}
        <div className="inventory-form__actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? t("common.working") : confirmLabel ?? t("common.delete")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
