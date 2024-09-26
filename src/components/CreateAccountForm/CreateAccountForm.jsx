import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";
import Button from "../../components/Button/Button";
import emailIcon from "../../assets/icons/mail.svg";
import lockIcon from "../../assets/icons/lock.svg";
import unlockIcon from "../../assets/icons/unlock.svg";
import "./CreateAccountForm.scss";

const CreateAccountForm = () => {
  const { createUser, error } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState("");

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (password !== confirmPassword) {
      return setFormError("Passwords do not match.");
    }

    try {
      await createUser(email, password, fullName);
      navigate("/");
    } catch (err) {
      setFormError(error || "Failed to create account.");
    }
  };

  return (
    <section className="create-account">
      <div className="create-account__content">
        <div className="create-account__header-container">
          <h1 className="create-account__header">CREATE ACCOUNT</h1>
        </div>
        <div className="create-account__form-container">
          <form
            className="create-account__form"
            id="createAccountForm"
            onSubmit={handleSubmit}
          >
            {formError && <p className="create-account__error">{formError}</p>}
            <label className="create-account__form-label" htmlFor="fullName">
              Full Name
              <input
                className="create-account__form-input"
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Your Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <img
                className={`create-account__lock-icon ${
                  isPasswordVisible ? "unlock" : ""
                }`}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <img
                className={`create-account__lock-icon ${
                  isPasswordVisible ? "unlock" : ""
                }`}
                src={isPasswordVisible ? unlockIcon : lockIcon}
                alt={isPasswordVisible ? "unlock icon" : "lock icon"}
                onClick={togglePasswordVisibility}
              />
            </label>
            <div className="create-account__button-container">
              <Button className="button--signup" type="submit">
                SIGN UP
              </Button>
              <Button to="/login" className="button--signin" type="button">
                SIGN IN
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CreateAccountForm;
