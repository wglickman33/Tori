import Button from "../Button/Button";
import "./AddItemModal.scss";

const AddItemModal = ({ isOpen, onClose }) => {
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
        <form className="additem-modal__form">
          <div className="additem-modal__row">
            <div className="additem-modal__group">
              <label className="additem-modal__label">Name</label>
              <input
                className="additem-modal__input"
                type="text"
                placeholder="Name..."
              />
            </div>
            <div className="additem-modal__group">
              <label className="additem-modal__label">Location</label>
              <select className="additem-modal__select">
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
              <label className="additem-modal__label">Purchase Date</label>
              <input type="date" className="additem-modal__input" />
            </div>
            <div className="additem-modal__group">
              <label className="additem-modal__label">Quantity</label>
              <input className="additem-modal__input" type="number" min="0" />
            </div>
          </div>
          <div className="additem-modal__row">
            <div className="additem-modal__group">
              <label className="additem-modal__label">
                Expiration Date (optional)
              </label>
              <input className="additem-modal__input" type="date" />
            </div>
            <div className="additem-modal__group">
              <label className="additem-modal__label">Custom Tag</label>
              <input
                className="additem-modal__input"
                type="text"
                placeholder="Tag..."
              />
            </div>
          </div>
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
