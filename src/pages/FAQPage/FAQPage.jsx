import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import "./FAQPage.scss";

const FAQPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <main className="faq">
      <section className="faq__header-content">
        <div className="faq__header-container">
          <div className="faq__logo-container">
            <img
              className="logo faq__logo"
              src="../../../src/assets/logos/tori-logo.svg"
              alt="Tori Logo"
            />
          </div>
          <h1 className="faq__header">Frequently Asked Questions (FAQs)</h1>
        </div>
        <div className="faq__menu">
          <Button
            className="button--menu faq__menu-button"
            onClick={toggleMenu}
          >
            <img
              className="faq__menu-icon icon"
              src="../../../src/assets/icons/menu.svg"
              alt="Menu Icon"
            />
          </Button>
        </div>
      </section>
      <div className="faq__body-content">
        <div className="faq__icon-container">
          <img
            className="faq__main-icon icon"
            src="../../../src/assets/icons/help.svg"
            alt="Help Icon"
          />
        </div>
        <div className="faq__body">
          <h2 className="faq__body-title">
            This page is currently unavailable
          </h2>
          <h3 className="faq__body-text">Click below to return to help page</h3>
        </div>
        <div className="faq__button-container">
          <Button to="/help" className="faq__button button--return">
            Return
          </Button>
        </div>
      </div>
      <SlidingMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
    </main>
  );
};

export default FAQPage;
