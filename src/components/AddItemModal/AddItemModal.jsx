import { useState } from "react";
import { createItem } from "../../services/firebaseService.js";
import Button from "../Button/Button";
import useFetchFolders from "../../hooks/useFetchFolders.js";
import "./AddItemModal.scss";

const AddItemModal = ({ isOpen, onClose, onItemAdded, userId }) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [expirationDate, setExpirationDate] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [folderId, setFolderId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { folders, loading: foldersLoading } = useFetchFolders(userId);

  const resetForm = () => {
    setName("");
    setLocation("");
    setPurchaseDate("");
    setQuantity(0);
    setExpirationDate("");
    setCustomTag("");
    setFolderId("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      setErrorMessage("Please enter a name for the item.");
      setSuccessMessage("");
      return;
    }

    const newItemData = {
      name,
      location: location || null,
      purchaseDate: purchaseDate || null,
      quantity: quantity || null,
      expirationDate: expirationDate || null,
      customTag: customTag || null,
    };

    try {
      const newItem = await createItem(userId, folderId, newItemData);
      onItemAdded(newItem);
      setSuccessMessage("Item successfully created!");
      setErrorMessage("");
      resetForm();
      setTimeout(() => {
        setSuccessMessage("");
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMessage("Error adding item. Please try again.");
      setSuccessMessage("");
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="additem-modal">
      <div className="additem-modal__content">
        <Button
          className="additem-modal__close button--close"
          onClick={onClose}
        >
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="additem-modal__close-icon"
          />
        </Button>
        <h2 className="additem-modal__title">Add a new item:</h2>
        <form className="additem-modal__form" onSubmit={handleSubmit}>
          <div className="additem-modal__row">
            <div className="additem-modal__group">
              <label className="additem-modal__label">Name</label>
              <input
                className="additem-modal__input"
                type="text"
                placeholder="Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="additem-modal__group">
              <label className="additem-modal__label">Location</label>
              <select
                className="additem-modal__select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option className="additem-modal__option">
                  Select a Location
                </option>
                <option className="additem-modal__option">
                  Upstairs Fridge
                </option>
                <option className="additem-modal__option">
                  Downstairs Fridge
                </option>
                <option className="additem-modal__option">Closet</option>
                <option className="additem-modal__option">Cabinet</option>
                <option className="additem-modal__option">Desk</option>
                <option className="additem-modal__option">Dresser</option>
                <option className="additem-modal__option">Attic</option>
                <option className="additem-modal__option">Crawl Space</option>
                <option className="additem-modal__option">Pantry</option>
                <option className="additem-modal__option">Garage</option>
                <option className="additem-modal__option">Laundry Room</option>
                <option className="additem-modal__option">
                  Hallway Closet
                </option>
                <option className="additem-modal__option">Shed</option>
                <option className="additem-modal__option">
                  Other (Add New)
                </option>
              </select>
            </div>
          </div>
          <div className="additem-modal__row">
            <div className="additem-modal__group">
              <label className="additem-modal__label">Folder (optional)</label>
              <select
                className="additem-modal__select"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              >
                <option value="">None</option>
                {foldersLoading ? (
                  <option>Loading folders...</option>
                ) : folders.length === 0 ? (
                  <option>No folders available</option>
                ) : (
                  folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          <div className="additem-modal__row">
            <div className="additem-modal__group">
              <label className="additem-modal__label">Purchase Date</label>
              <input
                type="date"
                className="additem-modal__input"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="additem-modal__group">
              <label className="additem-modal__label">Quantity</label>
              <input
                className="additem-modal__input"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>
          <div className="additem-modal__row">
            <div className="additem-modal__group">
              <label className="additem-modal__label">Expiration Date</label>
              <input
                className="additem-modal__input"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
            <div className="additem-modal__group">
              <label className="additem-modal__label">Custom Tag</label>
              <input
                className="additem-modal__input"
                type="text"
                placeholder="Tag..."
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
              />
            </div>
          </div>
          {successMessage && (
            <p className="additem-modal__message additem-modal__message--success">
              {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="additem-modal__message additem-modal__message--error">
              {errorMessage}
            </p>
          )}

          <Button
            className="additem-modal__submit button--additem"
            type="submit"
          >
            + Add Item
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
