import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import "./SettingsPage.scss";

const SettingsPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <main className="settings">
      <section className="settings__header-content">
        <div className="settings__header-container">
          <div className="settings__logo-container">
            <img
              className="logo settings__logo"
              src="../../../src/assets/logos/tori-logo.svg"
              alt="Tori Logo"
            />
          </div>
          <h1 className="settings__header">Settings</h1>
        </div>
        <div className="settings__menu">
          <Button
            className="button--menu settings__menu-button"
            onClick={toggleMenu}
          >
            <img
              className="settings__menu-icon icon"
              src="../../../src/assets/icons/menu.svg"
              alt="Menu Icon"
            />
          </Button>
        </div>
      </section>
      <div className="settings__body-content">
        <div className="settings__icon-container">
          <img
            className="settings__main-icon icon"
            src="../../../src/assets/icons/settings.svg"
            alt="Settings Icon"
          />
        </div>
        <div className="settings__body">
          <h2 className="settings__body-title">
            This page is currently unavailable
          </h2>
          <h3 className="settings__body-text">Click below to logout</h3>
        </div>
        <div className="settings__button-container">
          <Button className="settings__button button--logout">
            <img
              className="settings__icon logout-icon icon"
              src="../../../src/assets/icons/logout.svg"
              alt="Logout Icon"
            />
            Logout
          </Button>
        </div>
      </div>
      <SlidingMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
    </main>
  );
};

export default SettingsPage;
