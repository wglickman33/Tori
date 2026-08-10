import type { ReactNode } from "react";
import { Button } from "./Button";
import "./Modal.scss";

interface ModalProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, isOpen, onClose, children }: ModalProps) {
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
          <Button type="button" variant="ghost" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>
        <div className="tori-modal__body">{children}</div>
      </div>
    </div>
  );
}
