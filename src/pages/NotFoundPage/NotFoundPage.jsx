import { useState } from "react";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import "./NotFoundPage.scss";

const NotFoundPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <main className="notfound">
      <section className="notfound__header-content">
        <div className="notfound__header-container">
          <div className="notfound__logo-container">
            <img
              className="logo notfound__logo"
              src="../../../src/assets/logos/tori-logo.svg"
              alt="Tori Logo"
            />
          </div>
          <h1 className="notfound__header">404 Page Not Found</h1>
        </div>
        <div className="notfound__menu">
          <Button
            className="button--menu notfound__menu-button"
            onClick={toggleMenu}
          >
            <img
              className="notfound__menu-icon icon"
              src="../../../src/assets/icons/menu.svg"
              alt="Menu Icon"
            />
          </Button>
        </div>
      </section>
      <div className="notfound__body-content">
        <div className="notfound__icon-container">
          <img
            className="notfound__main-icon icon"
            src="../../../src/assets/icons/error.svg"
            alt="Not Found Icon"
          />
        </div>
        <div className="notfound__body">
          <h2 className="notfound__body-title">Oops! Page not found</h2>
          <h3 className="notfound__body-text">
            The page you are looking for does not exist.
          </h3>
        </div>
        <div className="notfound__button-container">
          <Button to="/" className="notfound__button button--return">
            <img
              className="notfound__icon return-icon icon"
              src="../../../src/assets/icons/back-arrow.svg"
              alt="Return Back Arrow Icon"
            />
            Return to Home
          </Button>
        </div>
      </div>
      <SlidingMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
    </main>
  );
};

export default NotFoundPage;
