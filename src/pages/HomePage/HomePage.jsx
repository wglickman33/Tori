import { useState } from "react";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import AddItemModal from "../../components/AddItemModal/AddItemModal";
import AddFolderModal from "../../components/AddFolderModal/AddFolderModal";
import EditItemModal from "../../components/EditItemModal/EditItemModal";
import EditFolderModal from "../../components/EditFolderModal/EditFolderModal";
import DeleteItemModal from "../../components/DeleteItemModal/DeleteItemModal";
import DeleteFolderModal from "../../components/DeleteFolderModal/DeleteFolderModal";
import "./HomePage.scss";

const mockFolders = [
  {
    id: "folder1",
    name: "Folder 1",
    items: [{ id: "item1", name: "Item 1" }],
  },
  {
    id: "folder2",
    name: "Folder 2",
    items: [
      { id: "item2", name: "Item 2" },
      { id: "item3", name: "Item 3" },
    ],
  },
];

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState({});

  const toggleFolder = (folderId) => {
    setOpenFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleAddItemModal = () => {
    setIsAddItemModalOpen(!isAddItemModalOpen);
  };

  const toggleAddFolderModal = () => {
    setIsAddFolderModalOpen(!isAddFolderModalOpen);
  };

  const toggleEditItemModal = () => {
    setIsEditItemModalOpen(!isEditItemModalOpen);
  };

  const toggleEditFolderModal = () => {
    setIsEditFolderModalOpen(!isEditFolderModalOpen);
  };

  const toggleDeleteItemModal = () => {
    setIsDeleteItemModalOpen(!isDeleteItemModalOpen);
  };

  const toggleDeleteFolderModal = () => {
    setIsDeleteFolderModalOpen(!isDeleteFolderModalOpen);
  };

  return (
    <main className="itempage">
      <section className="itempage__left">
        <div className="itempage__left-top">
          <div className="itempage__header-container">
            <div className="itempage__logo-container">
              <img
                className="logo itempage__logo"
                src="../../../src/assets/logos/tori-logo.svg"
                alt="Tori Logo"
              />
            </div>
            <h1 className="itempage__header">All Items</h1>
          </div>
          <div className="itempage__button-container">
            <Button
              className="button--add-item itempage__button"
              onClick={toggleAddItemModal}
            >
              Add Item
            </Button>
            <Button
              className="button--add-folder itempage__button"
              onClick={toggleAddFolderModal}
            >
              Add Folder
            </Button>
          </div>
        </div>
        <div className="itempage__search-bar">
          <div className="itempage__search-container">
            <img
              className="itempage__search-icon itempage__search-icon--left icon"
              src="../../../src/assets/icons/search.svg"
              alt="Search Icon"
            />
            <input
              className="itempage__search-text"
              placeholder="Search All Items"
            />
          </div>
          <div className="itempage__view-options">
            <Button className="button--sort itempage__view-button">
              <img
                className="itempage__view-icon icon"
                src="../../../src/assets/icons/sort.svg"
                alt="Sort Icon"
              />
            </Button>
            <Button className="button--grid itempage__view-button">
              <img
                className="itempage__view-icon icon"
                src="../../../src/assets/icons/grid.svg"
                alt="Grid Icon"
              />
            </Button>
          </div>
        </div>
        <div className="itempage__counts">
          <h2 className="itempage__count-text">Folders: 2</h2>
          <h2 className="itempage__count-text">Items: 3</h2>
        </div>
        <div className="itempage__left-bottom">
          <Button to="/help" className="button--help itempage__button">
            <img
              className="itempage__help-icon icon hover-invert"
              src="../../../src/assets/icons/help.svg"
              alt="Help Icon"
            />
            Help
          </Button>
        </div>
      </section>
      <section className="itempage__right">
        <div className="itempage__right-top">
          <div className="itempage__search-folders">
            <img
              className="itempage__search-icon itempage__search-icon--right icon"
              src="../../../src/assets/icons/search.svg"
              alt="Search Icon"
            />
            <input
              className="itempage__search-input"
              placeholder="Search Folders"
            />
          </div>
          <div className="itempage__menu">
            <Button
              className="button--menu itempage__button"
              onClick={toggleMenu}
            >
              <img
                className="itempage__menu-icon icon"
                src="../../../src/assets/icons/menu.svg"
                alt="Menu Icon"
              />
            </Button>
          </div>
        </div>
        <div className="itempage__folder-list">
          {mockFolders.map((folder) => (
            <div key={folder.id} className="itempage__folder">
              <div className="itempage__folder-header">
                <div className="itempage__all-items-list-left">
                  <img
                    className="itempage__items-icon icon"
                    src="../../../src/assets/icons/folder.svg"
                    alt="Folder Icon"
                  />
                  <h3 className="itempage__all-items-folders">{folder.name}</h3>
                  <img
                    className="itempage__items-icon icon clickable"
                    src={`../../../src/assets/icons/arrow-${
                      openFolders[folder.id] ? "drop-up" : "drop-down"
                    }.svg`}
                    alt="Toggle Icon"
                    onClick={() => toggleFolder(folder.id)}
                  />
                </div>
                <div className="itempage__all-items-list-right">
                  <img
                    className="itempage__items-icon icon clickable hoverable"
                    src="../../../src/assets/icons/edit.svg"
                    alt="Edit Icon"
                    onClick={toggleEditFolderModal}
                  />
                  <img
                    className="itempage__items-icon icon clickable hoverable"
                    src="../../../src/assets/icons/delete.svg"
                    alt="Trash Icon"
                    onClick={toggleDeleteFolderModal}
                  />
                </div>
              </div>
              {openFolders[folder.id] && (
                <div className="itempage__items">
                  {folder.items.map((item) => (
                    <div
                      key={item.id}
                      className="itempage__all-items-item-group"
                    >
                      <h4 className="itempage__all-items-item">{item.name}</h4>
                      <div className="itempage__all-items-item-icons">
                        <img
                          className="itempage__items-icon icon clickable hoverable"
                          src="../../../src/assets/icons/edit.svg"
                          alt="Edit Icon"
                          onClick={toggleEditItemModal}
                        />
                        <img
                          className="itempage__items-icon icon clickable hoverable"
                          src="../../../src/assets/icons/delete.svg"
                          alt="Trash Icon"
                          onClick={toggleDeleteItemModal}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="itempage__right-bottom">
          <Button className="button--trash itempage__button">
            <img
              className="itempage__trash-icon icon"
              src="../../../src/assets/icons/delete.svg"
              alt="Trash Icon"
            />
            Trash
          </Button>
        </div>
      </section>
      <SlidingMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
      <AddItemModal isOpen={isAddItemModalOpen} onClose={toggleAddItemModal} />
      <AddFolderModal
        isOpen={isAddFolderModalOpen}
        onClose={toggleAddFolderModal}
      />
      <EditItemModal
        isOpen={isEditItemModalOpen}
        onClose={toggleEditItemModal}
      />
      <EditFolderModal
        isOpen={isEditFolderModalOpen}
        onClose={toggleEditFolderModal}
      />
      <DeleteItemModal
        isOpen={isDeleteItemModalOpen}
        onClose={toggleDeleteItemModal}
      />
      <DeleteFolderModal
        isOpen={isDeleteFolderModalOpen}
        onClose={toggleDeleteFolderModal}
      />
    </main>
  );
};

export default HomePage;
