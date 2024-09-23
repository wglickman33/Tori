import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../components/Button/Button";
import loginIcon from "../../assets/icons/login.svg";
import emailIcon from "../../assets/icons/mail.svg";
import lockIcon from "../../assets/icons/lock.svg";
import unlockIcon from "../../assets/icons/unlock.svg";
import "./LoginForm.scss";

const LoginForm = () => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prevState) => !prevState);
  };

  return (
    <section className="login">
      <div className="login__content">
        <div className="login__header-container">
          <h1 className="login__header">LOGIN</h1>
        </div>
        <div className="login__form-container">
          <form className="login__form" id="loginForm">
            <label className="login__form-label" htmlFor="email">
              Enter Email
              <input
                className="login__form-input"
                type="email"
                id="email"
                name="email"
                placeholder="example@example.com"
              />
              <img
                className="login__mail-icon"
                src={emailIcon}
                alt="email icon"
              />
            </label>
            <label className="login__form-label" htmlFor="password">
              Enter Password
              <input
                className="login__form-input"
                type={isPasswordVisible ? "text" : "password"}
                id="password"
                name="password"
                placeholder="Password"
              />
              <img
                className={`login__lock-icon ${
                  isPasswordVisible ? "unlock" : ""
                }`}
                src={isPasswordVisible ? unlockIcon : lockIcon}
                alt={isPasswordVisible ? "unlock icon" : "lock icon"}
                onClick={togglePasswordVisibility}
              />
            </label>
            <div className="login__forgot-container">
              <label className="login__save-login" htmlFor="saveLogin">
                <input
                  className="login__save-login-checkbox"
                  type="checkbox"
                  id="saveLogin"
                  name="saveLogin"
                />{" "}
                Save Login Information{" "}
              </label>
              <Link className="login__forgot-link">Forgot Password?</Link>
            </div>
            <div className="login__button-container">
              <Button className="button--login" type="submit">
                <img
                  className="login__login-icon hover-invert"
                  src={loginIcon}
                  alt="login icon"
                />
                LOGIN
              </Button>
            </div>
            <p className="login__create-account">
              Don't have an account?{" "}
              <Link to="/create-account" className="login__create-account-link">
                Create Account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default LoginForm;
