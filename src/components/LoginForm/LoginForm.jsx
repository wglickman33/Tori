import { Link } from "react-router-dom";
import "./LoginForm.scss";

const LoginForm = () => {
  return (
    <section className="login">
      <div className="login__header-container">
        {/* This LOGIN h1 is going to be on a separate page */}
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
            />
          </label>
          <label className="login__form-label" htmlFor="password">
            Enter Password
            <input
              className="login__form-input"
              type="password"
              id="password"
              name="password"
            />
          </label>
          <div className="login__forgot-container">
            <label className="login__save-login" htmlFor="saveLogin">
              <input
                className="login__save-login-checkbox"
                type="checkbox"
                id="saveLogin"
                name="saveLogin"
              />
              Save Login Information
            </label>
            <Link className="login__forgot-link">Forgot Password?</Link>
          </div>
          <div className="login__button-container">
            <button type="submit" className="login__button">
              <img className="login__icon" alt="login icon" />
              LOGIN
            </button>
          </div>
          <p className="login__create-account">
            Don't have an account?{" "}
            <Link className="login__create-account-link">Create Account</Link>
          </p>
        </form>
      </div>
    </section>
  );
};

export default LoginForm;
