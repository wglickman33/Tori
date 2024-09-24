import { useState } from "react";
import Button from "../../components/Button/Button";
import SlidingMenu from "../../components/SlidingMenu/SlidingMenu";
import { faqs } from "../../data/faq-constants.js";
import "./FAQPage.scss";

const FAQPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
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
        {faqs.map((faq, index) => (
          <div key={index} className="faq__item">
            <div
              className="faq__question clickable"
              onClick={() => toggleFAQ(index)}
            >
              <h2>{faq.question}</h2>
              <img
                className="faq__icon icon"
                src={`../../../src/assets/icons/${
                  activeFAQ === index ? "arrow-drop-up" : "arrow-drop-down"
                }.svg`}
                alt="Drop Icon"
              />
            </div>
            {activeFAQ === index && (
              <div className="faq__answer">
                <p>{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
        <div className="faq__button-container">
          <Button to="/help" className="faq__return-button">
            Return
          </Button>
        </div>
      </div>
      <SlidingMenu isMenuOpen={isMenuOpen} toggleMenu={toggleMenu} />
    </main>
  );
};

export default FAQPage;
