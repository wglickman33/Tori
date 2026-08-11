import { useEffect, useState } from "react";
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
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}: ConfirmDeleteModalProps) {
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
      setError(err instanceof Error ? err.message : "Delete failed");
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
            Cancel
          </Button>
          <Button type="button" variant="danger" onClick={handleConfirm} disabled={loading}>
            {loading ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
