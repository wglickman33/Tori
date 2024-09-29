import { useState } from "react";
import useFetchItems from "../../hooks/useFetchItems.js";
import useFetchFolders from "../../hooks/useFetchFolders.js";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import AddItemModal from "../../components/AddItemModal/AddItemModal";
import AddFolderModal from "../../components/AddFolderModal/AddFolderModal";
import EditItemModal from "../../components/EditItemModal/EditItemModal";
import EditFolderModal from "../../components/EditFolderModal/EditFolderModal";
import DeleteItemModal from "../../components/DeleteItemModal/DeleteItemModal";
import DeleteFolderModal from "../../components/DeleteFolderModal/DeleteFolderModal";
import "./HomePage.scss";

const HomePage = () => {
  const { currentUser } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [isEditFolderModalOpen, setIsEditFolderModalOpen] = useState(false);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [isDeleteFolderModalOpen, setIsDeleteFolderModalOpen] = useState(false);
  const [openFolders, setOpenFolders] = useState({});
  const [newItems, setNewItems] = useState([]);
  const [newFolders, setNewFolders] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);

  const {
    items = [],
    loading: itemsLoading,
    error: itemsError,
  } = useFetchItems(currentUser?.uid);

  const {
    folders = [],
    loading: foldersLoading,
    error: foldersError,
  } = useFetchFolders(currentUser?.uid);

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

  const toggleEditItemModal = (item = null) => {
    setCurrentItem(item);
    setIsEditItemModalOpen(!isEditItemModalOpen);
  };

  const toggleEditFolderModal = (folder = null) => {
    setCurrentFolder(folder);
    setIsEditFolderModalOpen(!isEditFolderModalOpen);
  };

  const toggleDeleteItemModal = (item = null) => {
    setCurrentItem(item);
    setIsDeleteItemModalOpen(!isDeleteItemModalOpen);
  };

  const toggleDeleteFolderModal = (folder = null) => {
    setCurrentFolder(folder);
    setIsDeleteFolderModalOpen(!isDeleteFolderModalOpen);
  };

  const handleItemAdded = (newItem) => {
    setNewItems((prevItems) => [...prevItems, newItem]);
  };

  const handleFolderAdded = (newFolder) => {
    setNewFolders((prevFolders) => [...prevFolders, newFolder]);
  };

  const handleItemUpdated = (updatedItemData) => {
    setNewItems((prevItems) => {
      const filteredItems = prevItems.filter(
        (item) => item.id !== updatedItemData.id
      );
      return [...filteredItems, updatedItemData];
    });

    if (updatedItemData.folderId) {
      setOpenFolders((prevOpenFolders) => ({
        ...prevOpenFolders,
        [updatedItemData.folderId]: true,
      }));
    }

    if (
      updatedItemData.previousFolderId &&
      updatedItemData.previousFolderId !== updatedItemData.folderId
    ) {
      setOpenFolders((prevOpenFolders) => ({
        ...prevOpenFolders,
        [updatedItemData.previousFolderId]: false,
      }));
    }
  };

  const handleFolderUpdated = (updatedFolderData) => {
    setNewFolders((prevFolders) => {
      return prevFolders.map((folder) =>
        folder.id === updatedFolderData.id ? updatedFolderData : folder
      );
    });

    setOpenFolders((prevOpenFolders) => ({
      ...prevOpenFolders,
      [updatedFolderData.id]: true,
    }));
  };

  const handleItemDeleted = (deletedItemId) => {
    setNewItems((prevItems) =>
      prevItems.filter((item) => item.id !== deletedItemId)
    );
  };

  const handleFolderDeleted = (deletedFolderId) => {
    setNewFolders((prevFolders) =>
      prevFolders.filter((folder) => folder.id !== deletedFolderId)
    );

    const deletedItemsCount = newItems.filter(
      (item) => item.folderId === deletedFolderId
    ).length;

    setNewItems((prevItems) =>
      prevItems.filter((item) => item.folderId !== deletedFolderId)
    );

    setNewItems((prevItems) =>
      prevItems.slice(0, prevItems.length - deletedItemsCount)
    );
  };

  const getItemsByFolder = (folderId) => {
    const folderItems = items.filter((item) => item.folderId === folderId);
    const newFolderItems = newItems.filter(
      (item) => item.folderId === folderId
    );
    return folderItems.concat(newFolderItems);
  };

  const getIndependentItems = () => {
    const independentItems = items.filter((item) => !item.folderId);
    const newIndependentItems = newItems.filter((item) => !item.folderId);
    return independentItems.concat(newIndependentItems);
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
          <h2 className="itempage__count-text">
            Folders:{" "}
            {foldersLoading
              ? "Loading..."
              : [...(folders || []), ...newFolders].length}
          </h2>
          <h2 className="itempage__count-text">
            Items:{" "}
            {itemsLoading
              ? "Loading..."
              : [...(items || []), ...newItems].length}
          </h2>
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
        <div className="itempage__folders-list">
          {foldersLoading ? (
            <p>Loading folders...</p>
          ) : foldersError ? (
            <p>No folders found</p>
          ) : (
            [...(folders || []), ...newFolders].map((folder) => (
              <div key={folder.id} className="itempage__folder">
                <div
                  className="itempage__folder-header"
                  onClick={() => toggleFolder(folder.id)}
                >
                  <div className="itempage__folder-name">
                    <img
                      className="itempage__folder-icon icon clickable"
                      src="../../../src/assets/icons/folder.svg"
                      alt="Folder Icon"
                    />
                    {folder.name}
                    <img
                      className="itempage__items-icon icon clickable"
                      src={
                        openFolders[folder.id]
                          ? "../../../src/assets/icons/arrow-drop-down.svg"
                          : "../../../src/assets/icons/arrow-drop-up.svg"
                      }
                      alt="Dropdown or Dropup Icon"
                    />
                  </div>
                  <div className="itempage__folder-icons">
                    <img
                      className="itempage__items-icon icon clickable hoverable"
                      src="../../../src/assets/icons/edit.svg"
                      alt="Edit Icon"
                      onClick={() => toggleEditFolderModal(folder)}
                    />
                    <img
                      className="itempage__items-icon icon clickable hoverable"
                      src="../../../src/assets/icons/delete.svg"
                      alt="Delete Icon"
                      onClick={() => toggleDeleteFolderModal(folder)}
                    />
                  </div>
                </div>
                {openFolders[folder.id] && (
                  <div className="itempage__folder-items">
                    {getItemsByFolder(folder.id).map((item) => (
                      <div key={item.id} className="itempage__folder-item">
                        <p className="itempage__folder-item-text">
                          {item.name}
                        </p>
                        <div className="itempage__all-items-item-icons">
                          <img
                            className="itempage__items-icon icon clickable hoverable"
                            src="../../../src/assets/icons/edit.svg"
                            alt="Edit Icon"
                            onClick={() => toggleEditItemModal(item)}
                          />
                          <img
                            className="itempage__items-icon icon clickable hoverable"
                            src="../../../src/assets/icons/delete.svg"
                            alt="Delete Icon"
                            onClick={() => toggleDeleteItemModal(item)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="itempage__items-list">
          {itemsLoading ? (
            <p>Loading items...</p>
          ) : itemsError ? (
            <p>No items found</p>
          ) : (
            getIndependentItems().map((item) => (
              <div key={item.id} className="itempage__all-items-item-group">
                <h4 className="itempage__all-items-item">{item.name}</h4>
                <div className="itempage__all-items-item-icons">
                  <img
                    className="itempage__items-icon icon clickable hoverable"
                    src="../../../src/assets/icons/edit.svg"
                    alt="Edit Icon"
                    onClick={() => toggleEditItemModal(item)}
                  />
                  <img
                    className="itempage__items-icon icon clickable hoverable"
                    src="../../../src/assets/icons/delete.svg"
                    alt="Delete Icon"
                    onClick={() => toggleDeleteItemModal(item)}
                  />
                </div>
              </div>
            ))
          )}
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
      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={toggleAddItemModal}
        userId={currentUser?.uid}
        onItemAdded={handleItemAdded}
        folders={[...(folders || []), ...newFolders]}
      />
      <AddFolderModal
        isOpen={isAddFolderModalOpen}
        onClose={toggleAddFolderModal}
        onFolderAdded={handleFolderAdded}
        userId={currentUser?.uid}
      />
      <EditItemModal
        isOpen={isEditItemModalOpen}
        onClose={toggleEditItemModal}
        item={currentItem}
        userId={currentUser?.uid}
        onItemUpdated={handleItemUpdated}
      />
      <EditFolderModal
        isOpen={isEditFolderModalOpen}
        onClose={toggleEditFolderModal}
        folder={currentFolder}
        userId={currentUser?.uid}
        onFolderUpdated={handleFolderUpdated}
      />
      <DeleteItemModal
        isOpen={isDeleteItemModalOpen}
        onClose={toggleDeleteItemModal}
        item={currentItem}
        userId={currentUser?.uid}
        onItemDeleted={handleItemDeleted}
      />
      <DeleteFolderModal
        isOpen={isDeleteFolderModalOpen}
        onClose={toggleDeleteFolderModal}
        folder={currentFolder}
        userId={currentUser?.uid}
        onFolderDeleted={handleFolderDeleted}
      />
    </main>
  );
};

export default HomePage;
