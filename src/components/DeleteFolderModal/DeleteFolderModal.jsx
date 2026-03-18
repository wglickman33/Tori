import Button from "../Button/Button";
import { useState } from "react";
import { removeFolder } from "../../services/api.js";
import NotificationTab from "../NotificationTab/NotificationTab.jsx";
import "./DeleteFolderModal.scss";

const DeleteFolderModal = ({
  isOpen,
  onClose,
  folder,
  onFolderDeleted,
  userId,
}) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);

    try {
      const result = await removeFolder(userId, folder.id);

      if (result.success) {
        onFolderDeleted(folder.id);
        setNotification({ type: "success", message: "Folder successfully deleted!" });
        setTimeout(() => {
          setLoading(false);
          setNotification(null);
          onClose();
        }, 1000);
      } else {
        setNotification({ type: "error", message: "Failed to delete folder. Please try again." });
        setLoading(false);
      }
    } catch (error) {
      setNotification({ type: "error", message: "Error deleting folder. Please try again." });
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
        <NotificationTab
          type={notification?.type}
          message={notification?.message}
          onDismiss={() => setNotification(null)}
        />
      </div>
    </div>
  );
};

export default DeleteFolderModal;
