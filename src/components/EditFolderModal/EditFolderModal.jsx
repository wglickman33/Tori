import { useState, useEffect } from "react";
import { updateFolder } from "../../services/firebaseService.js";
import Button from "../Button/Button";
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
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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
      setErrorMessage("Please fill out all required fields.");
      setSuccessMessage("");
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
        setSuccessMessage("Folder successfully updated!");
        setErrorMessage("");

        setTimeout(() => {
          setSuccessMessage("");
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating folder:", error);
      setErrorMessage("Error updating folder. Please try again.");
      setSuccessMessage("");
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

          {successMessage && (
            <p className="editfolder-modal__message editfolder-modal__message--success">
              {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="editfolder-modal__message editfolder-modal__message--error">
              {errorMessage}
            </p>
          )}

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
