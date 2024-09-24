import Button from "../Button/Button";
import "./DeleteItemModal.scss";

const DeleteItemModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="deleteitem-modal">
      <div className="deleteitem-modal__content">
        <Button
          className="deleteitem-modal__close button--close"
          onClick={onClose}
        >
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="deleteitem-modal__close-icon"
          />
        </Button>
        <div className="deleteitem-modal__body-container">
          <div className="deleteitem-modal__icon-container">
            <img
              src="../../../src/assets/icons/delete.svg"
              alt="Trash Icon"
              className="deleteitem-modal__delete-icon"
            />
          </div>
          <div className="deleteitem-modal__body">
            <h2 className="deleteitem-modal__body-title">
              <span className="warning">WARNING:</span> You are about to delete
              the selected item
            </h2>
            <h3 className="deleteitem-modal__body-text">Are you sure?</h3>
          </div>
        </div>
        <div className="deleteitem-modal__button-container">
          <Button
            className="deleteitem-modal__cancel button--cancel"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="deleteitem-modal__submit button--deleteitem"
            type="submit"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteItemModal;
