import { useState, useEffect } from "react";
import { updateItem } from "../../services/api.js";
import Button from "../Button/Button";
import useFetchFolders from "../../hooks/useFetchFolders.js";
import NotificationTab from "../NotificationTab/NotificationTab.jsx";
import "./EditItemModal.scss";

const EditItemModal = ({ isOpen, onClose, item, onItemUpdated, userId }) => {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [expirationDate, setExpirationDate] = useState("");
  const [customTag, setCustomTag] = useState("");
  const [folderId, setFolderId] = useState("");
  const [previousFolderId, setPreviousFolderId] = useState("");
  const [notification, setNotification] = useState(null);

  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
  } = useFetchFolders(userId);

  useEffect(() => {
    if (item) {
      setName(item.name || "");
      setLocation(item.location || "");
      setPurchaseDate(item.purchaseDate || "");
      setQuantity(item.quantity || 0);
      setExpirationDate(item.expirationDate || "");
      setCustomTag(item.customTag || "");
      setFolderId(item.folderId || "");
      setPreviousFolderId(item.folderId || "");
    }
  }, [item]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name) {
      setNotification({ type: "error", message: "Please enter a name for the item." });
      return;
    }

    const updatedItemData = {
      ...item,
      name,
      location: location || null,
      purchaseDate: purchaseDate || null,
      quantity: quantity || null,
      expirationDate: expirationDate || null,
      customTag: customTag || null,
      folderId: folderId || null,
      previousFolderId: previousFolderId || null,
    };

    try {
      const result = await updateItem(
        userId,
        item.id,
        folderId,
        item.folderId,
        updatedItemData
      );

      if (result.success) {
        onItemUpdated(updatedItemData);
        setNotification({ type: "success", message: "Item successfully updated!" });
        setTimeout(() => {
          setNotification(null);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating item:", error);
      setNotification({ type: "error", message: "Error updating item. Please try again." });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="edititem-modal">
      <div className="edititem-modal__content">
        <Button
          className="edititem-modal__close button--close"
          onClick={onClose}
        >
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="edititem-modal__close-icon"
          />
        </Button>
        <h2 className="edititem-modal__title">Edit your current item:</h2>
        <form className="edititem-modal__form" onSubmit={handleSubmit}>
          <div className="edititem-modal__row">
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Name</label>
              <input
                className="edititem-modal__input"
                type="text"
                placeholder="Name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Location</label>
              <select
                className="edititem-modal__select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option className="edititem-modal__option">
                  Select a Location
                </option>
                <option className="edititem-modal__option">
                  Upstairs Fridge
                </option>
                <option className="edititem-modal__option">
                  Downstairs Fridge
                </option>
                <option className="edititem-modal__option">Closet</option>
                <option className="edititem-modal__option">Cabinet</option>
                <option className="edititem-modal__option">Desk</option>
                <option className="edititem-modal__option">Dresser</option>
                <option className="edititem-modal__option">Attic</option>
                <option className="edititem-modal__option">Crawl Space</option>
                <option className="edititem-modal__option">Pantry</option>
                <option className="edititem-modal__option">Garage</option>
                <option className="edititem-modal__option">Laundry Room</option>
                <option className="edititem-modal__option">
                  Hallway Closet
                </option>
                <option className="edititem-modal__option">Shed</option>
                <option className="edititem-modal__option">
                  Other (Add New)
                </option>
              </select>
            </div>
          </div>

          <div className="edititem-modal__row">
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Folder (optional)</label>
              <select
                className="edititem-modal__select"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              >
                <option value="">None (Independent)</option>
                {foldersLoading ? (
                  <option>Loading folders...</option>
                ) : foldersError ? (
                  <option>Error loading folders</option>
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

          <div className="edititem-modal__row">
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Purchase Date</label>
              <input
                type="date"
                className="edititem-modal__input"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Quantity</label>
              <input
                className="edititem-modal__input"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
          </div>

          <div className="edititem-modal__row">
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">
                Expiration Date (optional)
              </label>
              <input
                className="edititem-modal__input"
                type="date"
                value={expirationDate}
                onChange={(e) => setExpirationDate(e.target.value)}
              />
            </div>
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">
                Custom Tag (optional)
              </label>
              <input
                className="edititem-modal__input"
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
            className="edititem-modal__submit button--edititem"
            type="submit"
          >
            Save Changes
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
