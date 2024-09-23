import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import "./HelpPage.scss";

const HelpPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <main className="help-page">
      <section className="help-page__header-content">
        <div className="help-page__header-container">
          <div className="help-page__logo-container">
            <img
              className="logo help-page__logo"
              src="../../../src/assets/logos/tori-logo.svg"
              alt="Tori Logo"
            />
          </div>
          <h1 className="help-page__header">Help</h1>
        </div>
        <div className="help-page__menu">
          <Button
            className="button--menu help-page__menu-button"
            onClick={toggleMenu}
          >
            <img
              className="help-page__menu-icon icon"
              src="../../../src/assets/icons/menu.svg"
              alt="Menu Icon"
            />
          </Button>
        </div>
      </section>
      <div className="help-page__body-content">
        <div className="help-page__icon-container">
          <img
            className="help-page__icon icon"
            src="../../../src/assets/icons/help.svg"
            alt="Help Icon"
          />
        </div>
        <div className="help-page__body">
          <h2 className="help-page__body-title">
            This page is currently unavailable
          </h2>
          <h3 className="help-page__body-text">
            Click below to see some Frequently Asked Questions (FAQs)
          </h3>
        </div>
        <div className="help-page__button-container">
          <Button to="/faqs" className="help-page__button button--faqs">
            View FAQs
          </Button>
        </div>
      </div>
      <SlidingMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
    </main>
  );
};

export default HelpPage;
