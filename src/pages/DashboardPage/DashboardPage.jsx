import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import "./DashboardPage.scss";

const DashboardPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <main className="dashboard">
      <section className="dashboard__content">
        <div className="dashboard__header-container">
          <div className="dashboard__logo-container">
            <img
              className="logo dashboard__logo"
              src="../../../src/assets/logos/tori-logo.svg"
              alt="Tori Logo"
            />
          </div>
          <h1 className="dashboard__header">Dashboard</h1>
        </div>
        <div className="dashboard__menu">
          <Button
            className="button--menu dashboard__button"
            onClick={toggleMenu}
          >
            <img
              className="dashboard__menu-icon icon"
              src="../../../src/assets/icons/menu.svg"
              alt="Menu Icon"
            />
          </Button>
        </div>
      </section>
      <section className="inventory">
        <div className="inventory__container">
          <h2 className="inventory__title">Inventory Summary</h2>
          <div className="inventory__card-container">
            <div className="inventory__card card1">
              <Link to="/" className="inventory__card-link">
                <div className="inventory__icon-container inventory__icon-container--hoverable">
                  <img
                    className="inventory__icon inventory__icon--hoverable icon"
                    src="../../../src/assets/icons/folder.svg"
                    alt="Folder Icon"
                  />
                </div>
              </Link>
              <div className="inventory__card-text">
                <h3>0</h3>
                <h3>Folders</h3>
              </div>
            </div>
            <div className="inventory__card card2">
              <Link to="/" className="inventory__card-link">
                <div className="inventory__icon-container inventory__icon-container--alternate inventory__icon-container--hoverable">
                  <img
                    className="inventory__icon icon"
                    src="../../../src/assets/icons/items.svg"
                    alt="Items Icon"
                  />
                </div>
              </Link>
              <div className="inventory__card-text">
                <h3>0</h3>
                <h3>Items</h3>
              </div>
            </div>
            <div className="inventory__card card3">
              <div className="inventory__icon-container">
                <img
                  className="inventory__icon icon"
                  src="../../../src/assets/icons/quantity.svg"
                  alt="Quantity Icon"
                />
              </div>
              <div className="inventory__card-text">
                <h3>0</h3>
                <h3>Total Quantity</h3>
              </div>
            </div>
            <div className="inventory__card card4">
              <div className="inventory__icon-container inventory__icon-container--alternate">
                <img
                  className="inventory__icon icon"
                  src="../../../src/assets/icons/money.svg"
                  alt="Money Icon"
                />
              </div>
              <div className="inventory__card-text">
                <h3>0</h3>
                <h3>Total Value</h3>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="help">
        <div className="help__button-container">
          <Button to="/help" className="button--help help__button">
            <img
              className="dashboard__help-icon icon hover-invert"
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

export default DashboardPage;
