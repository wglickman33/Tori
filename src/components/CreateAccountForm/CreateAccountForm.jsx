import { useState } from "react";
import { Link } from "react-router-dom";
import loginIcon from "../../assets/icons/login.svg";
import emailIcon from "../../assets/icons/mail.svg";
import lockIcon from "../../assets/icons/lock.svg";
import unlockIcon from "../../assets/icons/unlock.svg";
import "./CreateAccountForm.scss";

const CreateAccountForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  return (
    <section className="create-account">
      <div className="create-account__content">
        <div className="create-account__header-container">
          <h1 className="create-account__header">CREATE ACCOUNT</h1>
        </div>
        <div className="create-account__form-container">
          <form className="create-account__form" id="createAccountForm">
            <label className="create-account__form-label" htmlFor="fullName">
              Full Name
              <input
                className="create-account__form-input"
                type={isPasswordVisible ? "text" : "password"}
                id="fullName"
                name="fullName"
                placeholder="Your Name"
              />
            </label>
            <label className="create-account__form-label" htmlFor="email">
              Enter Email
              <input
                className="create-account__form-input"
                type="email"
                id="email"
                name="email"
                placeholder="example@example.com"
              />
              <img
                className="create-account__mail-icon"
                src={emailIcon}
                alt="email icon"
              />
            </label>
            <label className="create-account__form-label" htmlFor="password">
              Enter Password
              <input
                className="create-account__form-input"
                type={isPasswordVisible ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password"
              />
              <img
                className="create-account__lock-icon"
                src={isPasswordVisible ? unlockIcon : lockIcon}
                alt={isPasswordVisible ? "unlock icon" : "lock icon"}
                onClick={togglePasswordVisibility}
              />
            </label>
            <label
              className="create-account__form-label"
              htmlFor="confirmPassword"
            >
              Confirm Password
              <input
                className="create-account__form-input"
                type={isPasswordVisible ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm password"
              />
              <img
                className="create-account__lock-icon"
                src={isPasswordVisible ? unlockIcon : lockIcon}
                alt={isPasswordVisible ? "unlock icon" : "lock icon"}
                onClick={togglePasswordVisibility}
              />
            </label>
            <div className="create-account__button-container">
              <button
                type="submit"
                className="create-account__button create-account__button--signup"
              >
                SIGN UP
              </button>
              <button
                type="submit"
                className="create-account__button create-account__button--signin"
              >
                SIGN IN
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CreateAccountForm;
