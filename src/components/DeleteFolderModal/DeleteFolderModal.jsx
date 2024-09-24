import Button from "../Button/Button";
import "./DeleteFolderModal.scss";

const DeleteFolderModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="deletefolder-modal">
      <div className="deletefolder-modal__content">
        <Button
          className="deletefolder-modal__close button--close"
          onClick={onClose}
        >
          <img
            src="../../../src/assets/icons/close.svg"
            alt="Close Icon"
            className="deletefolder-modal__close-icon"
          />
        </Button>
        <div className="deletefolder-modal__body-container">
          <div className="deletefolder-modal__icon-container">
            <img
              src="../../../src/assets/icons/delete.svg"
              alt="Trash Icon"
              className="deletefolder-modal__delete-icon"
            />
          </div>
          <div className="deletefolder-modal__body">
            <h2 className="deletefolder-modal__body-title">
              <span className="warning">WARNING:</span> You are about to delete
              the selected folder
            </h2>
            <h3 className="deletefolder-modal__body-text">Are you sure?</h3>
          </div>
        </div>
        <div className="deletefolder-modal__button-container">
          <Button
            className="deletefolder-modal__cancel button--cancel"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="deletefolder-modal__submit button--deletefolder"
            type="submit"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteFolderModal;
