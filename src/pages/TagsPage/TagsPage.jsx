import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import "./TagsPage.scss";

const TagsPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <main className="tags">
      <section className="tags__header-content">
        <div className="tags__header-container">
          <div className="tags__logo-container">
            <img
              className="logo tags__logo"
              src="../../../src/assets/logos/tori-logo.svg"
              alt="Tori Logo"
            />
          </div>
          <h1 className="tags__header">Tags</h1>
        </div>
        <div className="tags__menu">
          <Button
            className="button--menu tags__menu-button"
            onClick={toggleMenu}
          >
            <img
              className="tags__menu-icon icon"
              src="../../../src/assets/icons/menu.svg"
              alt="Menu Icon"
            />
          </Button>
        </div>
      </section>
      <div className="tags__body-content">
        <div className="tags__icon-container">
          <img
            className="tags__icon icon"
            src="../../../src/assets/icons/tags.svg"
            alt="Tags Icon"
          />
        </div>
        <div className="tags__body">
          <h2 className="tags__body-title">You don't have any tags</h2>
          <h3 className="tags__body-text">Click below to get started!</h3>
        </div>
        <div className="tags__button-container">
          <Button className="tags__button button--addtag">+ Add Tag</Button>
        </div>
      </div>
      <div className="help">
        <div className="help__button-container">
          <Button to="/help" className="button--help help__button">
            <img
              className="tags__help-icon icon hover-invert"
              src="../../../src/assets/icons/help.svg"
              alt="Help Icon"
            />
            Help
          </Button>
        </div>
      </div>
      <SlidingMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
    </main>
  );
};

export default TagsPage;
