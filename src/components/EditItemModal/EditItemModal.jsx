import Button from "../Button/Button";
import "./EditItemModal.scss";

const EditItemModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

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
        <form className="edititem-modal__form">
          <div className="edititem-modal__row">
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Name</label>
              <input
                className="edititem-modal__input"
                type="text"
                placeholder="Name..."
              />
            </div>
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Location</label>
              <select className="edititem-modal__select">
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
              <label className="edititem-modal__label">Purchase Date</label>
              <input type="date" className="edititem-modal__input" />
            </div>
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Quantity</label>
              <input className="edititem-modal__input" type="number" min="0" />
            </div>
          </div>
          <div className="edititem-modal__row">
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">
                Expiration Date (optional)
              </label>
              <input className="edititem-modal__input" type="date" />
            </div>
            <div className="edititem-modal__group">
              <label className="edititem-modal__label">Custom Tag</label>
              <input
                className="edititem-modal__input"
                type="text"
                placeholder="Tag..."
              />
            </div>
          </div>
          <Button
            className="edititem-modal__submit button--edititem"
            type="submit"
          >
            Edit Item
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
