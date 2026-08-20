import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "./Modal.scss";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6 6l12 12M18 6L6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Modal({ title, isOpen, onClose, children }: ModalProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <div className="tori-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="tori-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tori-modal__header">
          <h2 className="tori-modal__title">{title}</h2>
          <button type="button" className="tori-modal__close" onClick={onClose} aria-label={t("common.close")}>
            <CloseIcon />
          </button>
        </div>
        <div className="tori-modal__body">{children}</div>
      </div>
    </div>
  );
}
