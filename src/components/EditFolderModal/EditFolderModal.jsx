import Button from "../Button/Button";
import "./EditFolderModal.scss";

const EditFolderModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

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
        <form className="editfolder-modal__form">
          <div className="editfolder-modal__row">
            <div className="editfolder-modal__group">
              <label className="editfolder-modal__label">Name</label>
              <input
                className="editfolder-modal__input"
                type="text"
                placeholder="Name..."
              />
            </div>
            <div className="editfolder-modal__group">
              <label className="editfolder-modal__label">Type</label>
              <select className="editfolder-modal__select">
                <option className="editfolder-modal__option">
                  Select a Type
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
              <input type="date" className="editfolder-modal__input" />
            </div>
            <div className="editfolder-modal__group">
              <label className="editfolder-modal__label">Custom Tag</label>
              <input
                className="editfolder-modal__input"
                type="text"
                placeholder="Tag..."
              />
            </div>
          </div>
          <Button
            className="editfolder-modal__submit button--editfolder"
            type="submit"
          >
            Edit Folder
          </Button>
        </form>
      </div>
    </div>
  );
};

export default EditFolderModal;
