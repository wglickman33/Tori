import Button from "../Button/Button";
import { useState } from "react";
import { removeFolder } from "../../services/firebaseService.js";
import "./DeleteFolderModal.scss";

const DeleteFolderModal = ({
  isOpen,
  onClose,
  folder,
  onFolderDeleted,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await removeFolder(userId, folder.id);

      if (result.success) {
        onFolderDeleted(folder.id);
        setSuccessMessage("Folder successfully deleted!");
        setErrorMessage("");

        setTimeout(() => {
          setLoading(false);
          setSuccessMessage("");
          onClose();
        }, 1000);
      } else {
        setErrorMessage("Failed to delete folder. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      setErrorMessage("Error deleting folder. Please try again.");
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="deletefolder-modal">
      <div className="deletefolder-modal__content">
        <Button
          className="deletefolder-modal__close button--close"
          onClick={onClose}
        >
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="deletefolder-modal__close-icon"
          />
        </Button>
        <div className="deletefolder-modal__body-container">
          <div className="deletefolder-modal__icon-container">
            <img
              src="../../../src/assets/icons/delete.svg"
              alt="Trash Icon"
              className="deletefolder-modal__delete-icon"
            />
          </div>
          <div className="deletefolder-modal__body">
            <h2 className="deletefolder-modal__body-title">
              <span className="warning">WARNING:</span> You are about to delete
              the selected folder
            </h2>
            <h3 className="deletefolder-modal__body-text">Are you sure?</h3>
          </div>
        </div>
        <div className="deletefolder-modal__button-container">
          <Button
            className="deletefolder-modal__cancel button--cancel"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="deletefolder-modal__submit button--deletefolder"
            type="button"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
        {errorMessage && (
          <p className="deletefolder-modal__message deletefolder-modal__message--error">
            {errorMessage}
          </p>
        )}
        {successMessage && (
          <p className="deletefolder-modal__message deletefolder-modal__message--success">
            {successMessage}
          </p>
        )}
      </div>
    </div>
  );
};

export default DeleteFolderModal;
