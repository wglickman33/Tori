import { useState } from "react";
import Button from "../../components/Button/Button";
import "./HomePage.scss";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
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
            <Button className="button--add-item itempage__button">
              Add Item
            </Button>
            <Button className="button--add-folder itempage__button">
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
          <h2 className="itempage__count-text">Folders: 0</h2>
          <h2 className="itempage__count-text">Items: 0</h2>
        </div>
        <div className="itempage__left-bottom">
          <Button to="/help" className="button--help itempage__button">
            <img
              className="itempage__help-icon icon"
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
        <div className="itempage__all-items">
          <img
            className="itempage__items-icon icon"
            src="../../../src/assets/icons/items.svg"
            alt="Items Icon"
          />
          <h2 className="itempage__all-items-text">All Items</h2>
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
    </main>
  );
};

export default HomePage;
