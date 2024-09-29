import Button from "../Button/Button";
import { useState } from "react";
import { removeItem } from "../../services/firebaseService.js";
import "./DeleteItemModal.scss";

const DeleteItemModal = ({ isOpen, onClose, item, onItemDeleted, userId }) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await removeItem(userId, item.id, item.folderId);

      if (result.success) {
        onItemDeleted(item.id);
        setSuccessMessage("Item successfully deleted!");
        setErrorMessage("");

        setTimeout(() => {
          setLoading(false);
          setSuccessMessage("");
          onClose();
        }, 1000);
      } else {
        setErrorMessage("Failed to delete item. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      setErrorMessage("Error deleting item. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="deleteitem-modal">
      <div className="deleteitem-modal__content">
        <Button
          className="deleteitem-modal__close button--close"
          onClick={onClose}
        >
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="deleteitem-modal__close-icon"
          />
        </Button>
        <div className="deleteitem-modal__body-container">
          <div className="deleteitem-modal__icon-container">
            <img
              src="../../../src/assets/icons/delete.svg"
              alt="Trash Icon"
              className="deleteitem-modal__delete-icon"
            />
          </div>
          <div className="deleteitem-modal__body">
            <h2 className="deleteitem-modal__body-title">
              <span className="warning">WARNING:</span> You are about to delete
              the selected item
            </h2>
            <h3 className="deleteitem-modal__body-text">Are you sure?</h3>
          </div>
        </div>
        <div className="deleteitem-modal__button-container">
          <Button
            className="deleteitem-modal__cancel button--cancel"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="deleteitem-modal__submit button--deleteitem"
            type="button"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
        {errorMessage && (
          <p className="deleteitem-modal__message deleteitem-modal__message--error">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="deleteitem-modal__message deleteitem-modal__message--success">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default DeleteItemModal;
