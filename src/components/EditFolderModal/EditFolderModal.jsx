import { useState, useEffect } from "react";
import { updateFolder } from "../../services/api.js";
import Button from "../Button/Button";
import NotificationTab from "../NotificationTab/NotificationTab.jsx";
import "./EditFolderModal.scss";

const EditFolderModal = ({
  isOpen,
  onClose,
  folder,
  onFolderUpdated,
  userId,
}) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (folder) {
      setName(folder.name || "");
      setType(folder.type || "");
      setCreationDate(folder.creationDate || "");
      setCustomTag(folder.customTag || "");
    }
  }, [folder]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !type) {
      setNotification({ type: "error", message: "Please fill out all required fields." });
      return;
    }

    const updatedFolderData = {
      ...folder,
      name,
      type,
      creationDate: creationDate || null,
      customTag: customTag || null,
    };

    try {
      const result = await updateFolder(userId, folder.id, updatedFolderData);

      if (result.success) {
        onFolderUpdated(updatedFolderData);
        setNotification({ type: "success", message: "Folder successfully updated!" });
        setTimeout(() => {
          setNotification(null);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating folder:", error);
      setNotification({ type: "error", message: "Error updating folder. Please try again." });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="editfolder-modal">
      <div className="editfolder-modal__content">
        <Button
          className="editfolder-modal__close button--close"
          onClick={onClose}
        >
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="editfolder-modal__close-icon"
          />
        </Button>
        <h2 className="editfolder-modal__title">Edit your current folder:</h2>
        <form className="editfolder-modal__form" onSubmit={handleSubmit}>
          <div className="editfolder-modal__row">
            <div className="editfolder-modal__group">
              <label className="editfolder-modal__label">Name</label>
              <input
                className="editfolder-modal__input"
                type="text"
                placeholder="Folder Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="editfolder-modal__group">
              <label className="editfolder-modal__label">Category</label>
              <select
                className="editfolder-modal__select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option className="editfolder-modal__option" value="">
                  Select a Category
                </option>
                <option className="editfolder-modal__option">
                  Electronics
                </option>
                <option className="editfolder-modal__option">
                  Frozen Food
                </option>
                <option className="editfolder-modal__option">
                  Refrigerated Food
                </option>
                <option className="editfolder-modal__option">
                  Unrefrigerated Food
                </option>
                <option className="editfolder-modal__option">Clothing</option>
                <option className="editfolder-modal__option">Jewelry</option>
                <option className="editfolder-modal__option">Shoes</option>
                <option className="editfolder-modal__option">
                  Sports Equipment
                </option>
                <option className="editfolder-modal__option">Tools</option>
                <option className="editfolder-modal__option">
                  Other (Add New)
                </option>
              </select>
            </div>
          </div>

          <div className="editfolder-modal__row">
            <div className="editfolder-modal__group">
              <label className="editfolder-modal__label">Creation Date</label>
              <input
                type="date"
                className="editfolder-modal__input"
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
              />
            </div>
            <div className="editfolder-modal__group">
              <label className="editfolder-modal__label">Custom Tag</label>
              <input
                className="editfolder-modal__input"
                type="text"
                placeholder="Tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
              />
            </div>
          </div>

          <NotificationTab
            type={notification?.type}
            message={notification?.message}
            onDismiss={() => setNotification(null)}
          />

          <Button
            className="editfolder-modal__submit button--editfolder"
            type="submit"
          >
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditFolderModal;
