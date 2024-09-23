import Button from "../Button/Button";
import "./AddFolderModal.scss";

const AddFolderModal = ({ isOpen, onClose }) => {
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
        <form className="addfolder-modal__form">
          <div className="addfolder-modal__row">
            <div className="addfolder-modal__group">
              <label className="addfolder-modal__label">Name</label>
              <input
                className="addfolder-modal__input"
                type="text"
                placeholder="Name..."
              />
            </div>
            <div className="addfolder-modal__group">
              <label className="addfolder-modal__label">Type</label>
              <select className="addfolder-modal__select">
                <option className="addfolder-modal__option">
                  Select a Type
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
              <input type="date" className="addfolder-modal__input" />
            </div>
            <div className="addfolder-modal__group">
              <label className="addfolder-modal__label">Custom Tag</label>
              <input
                className="addfolder-modal__input"
                type="text"
                placeholder="Tag..."
              />
            </div>
          </div>
          <Button
            className="addfolder-modal__submit button--addfolder"
            type="submit"
          >
            + Add Folder
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddFolderModal;
