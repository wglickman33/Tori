import Button from "../Button/Button";
import "./AddTagModal.scss";

const AddTagModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="addtag-modal">
      <div className="addtag-modal__content">
        <Button className="addtag-modal__close button--close" onClick={onClose}>
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="addtag-modal__close-icon"
          />
        </Button>
        <h2 className="addtag-modal__title">Add a new tag:</h2>
        <form className="addtag-modal__form">
          <div className="addtag-modal__row">
            <div className="addtag-modal__group">
              <label className="addtag-modal__label">Tag Name</label>
              <input
                className="addtag-modal__input"
                type="text"
                placeholder="Tag Name..."
              />
            </div>
            <div className="addtag-modal__group">
              <label className="addtag-modal__label">To Which Folder</label>
              <select className="addtag-modal__select">
                <option className="addtag-modal__option">
                  Select a Folder
                </option>
                <option className="addtag-modal__option">None</option>
              </select>
            </div>
          </div>
          <div className="addtag-modal__row">
            <div className="addtag-modal__group">
              <label className="addtag-modal__label">To Which Item</label>
              <select className="addtag-modal__select">
                <option className="addtag-modal__option">Select an Item</option>
                <option className="addtag-modal__option">None</option>
              </select>
            </div>
          </div>
          <Button className="addtag-modal__submit button--addtag" type="submit">
            + Add Tag
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AddTagModal;
