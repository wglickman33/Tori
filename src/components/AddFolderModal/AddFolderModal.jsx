import { useState } from "react";
import Button from "../Button/Button";
import { createFolder } from "../../services/api.js";
import NotificationTab from "../NotificationTab/NotificationTab.jsx";
import "./AddFolderModal.scss";

const AddFolderModal = ({ isOpen, onClose, userId }) => {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [creationDate, setCreationDate] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setType("");
    setCreationDate("");
    setCustomTag("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!name || !type) {
      setNotification({ type: "error", message: "Please fill out all required fields." });
      return;
    }

    setLoading(true);

    const newFolderData = {
      name,
      type,
      creationDate: creationDate || null,
      customTag: customTag || null,
    };

    try {
      const newFolder = await createFolder(userId, newFolderData);

      if (newFolder) {
        setNotification({ type: "success", message: "Folder successfully created!" });
        resetForm();

        setTimeout(() => {
          setNotification(null);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error adding folder: ", error);
      setNotification({ type: "error", message: "Error adding folder. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="addfolder-modal">
      <div className="addfolder-modal__content">
        <Button
          className="addfolder-modal__close button--close"
          onClick={onClose}
        >
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="addfolder-modal__close-icon"
          />
        </Button>
        <h2 className="addfolder-modal__title">Add a new folder:</h2>
        <form className="addfolder-modal__form" onSubmit={handleSubmit}>
          <div className="addfolder-modal__row">
            <div className="addfolder-modal__group">
              <label className="addfolder-modal__label">Name</label>
              <input
                className="addfolder-modal__input"
                type="text"
                placeholder="Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="addfolder-modal__group">
              <label className="addfolder-modal__label">Category</label>
              <select
                className="addfolder-modal__select"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option className="addfolder-modal__option">
                  Select a Category
                </option>
                <option className="addfolder-modal__option">Electronics</option>
                <option className="addfolder-modal__option">Frozen Food</option>
                <option className="addfolder-modal__option">
                  Refrigerated Food
                </option>
                <option className="addfolder-modal__option">
                  Unrefrigerated Food
                </option>
                <option className="addfolder-modal__option">Clothing</option>
                <option className="addfolder-modal__option">Jewelry</option>
                <option className="addfolder-modal__option">Shoes</option>
                <option className="addfolder-modal__option">
                  Sports Equipment
                </option>
                <option className="addfolder-modal__option">Tools</option>
                <option className="addfolder-modal__option">
                  Other (Add New)
                </option>
              </select>
            </div>
          </div>
          <div className="addfolder-modal__row">
            <div className="addfolder-modal__group">
              <label className="addfolder-modal__label">Creation Date</label>
              <input
                type="date"
                className="addfolder-modal__input"
                value={creationDate}
                onChange={(e) => setCreationDate(e.target.value)}
              />
            </div>
            <div className="addfolder-modal__group">
              <label className="addfolder-modal__label">Custom Tag</label>
              <input
                className="addfolder-modal__input"
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
            className="addfolder-modal__submit button--addfolder"
            type="submit"
            disabled={loading}
          >
            {loading ? "Adding..." : "+ Add Folder"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddFolderModal;
