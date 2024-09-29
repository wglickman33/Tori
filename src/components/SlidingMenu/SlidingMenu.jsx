import { Link, useLocation, useNavigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import useAuth from "../../hooks/useAuth.js";
import "./SlidingMenu.scss";

const SlidingMenu = ({ isMenuOpen, toggleMenu }) => {
  const { logOutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "sliding-menu__list-link--active" : "";
  };

  const handleLogout = async () => {
    try {
      await logOutUser();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  return (
    <aside className={`sliding-menu ${isMenuOpen ? "open" : ""}`}>
      <div className="sliding-menu__close" onClick={toggleMenu}>
        <img
          className="sliding-menu__close-icon"
          src="../../../src/assets/icons/close.svg"
          alt="Close Menu"
        />
      </div>
      <ul className="sliding-menu__list">
        <li className="sliding-menu__list-item">
          <Link
            to="/dashboard"
            className={`sliding-menu__list-link ${isActive("/dashboard")}`}
          >
            <img
              className="sliding-menu__list-icon"
              src="../../../src/assets/icons/dashboard.svg"
              alt="Dashboard Icon"
            />
            Dashboard
          </Link>
        </li>
        <li className="sliding-menu__list-item">
          <Link
            to="/items"
            className={`sliding-menu__list-link ${isActive("/items")}`}
          >
            <img
              className="sliding-menu__list-icon"
              src="../../../src/assets/icons/items.svg"
              alt="Items Icon"
            />
            Items
          </Link>
        </li>
        <li className="sliding-menu__list-item">
          <Link
            to="/search"
            className={`sliding-menu__list-link ${isActive("/search")}`}
          >
            <img
              className="sliding-menu__list-icon"
              src="../../../src/assets/icons/search.svg"
              alt="Search Icon"
            />
            Search
          </Link>
        </li>
        <li className="sliding-menu__list-item">
          <Link
            to="/tags"
            className={`sliding-menu__list-link ${isActive("/tags")}`}
          >
            <img
              className="sliding-menu__list-icon"
              src="../../../src/assets/icons/tags.svg"
              alt="Tags Icon"
            />
            Tags
          </Link>
        </li>
        <li className="sliding-menu__list-item">
          <Link
            to="/help"
            className={`sliding-menu__list-link ${isActive("/help")}`}
          >
            <img
              className="sliding-menu__list-icon"
              src="../../../src/assets/icons/help.svg"
              alt="Help Icon"
            />
            Help
          </Link>
        </li>
        <li className="sliding-menu__list-item">
          <Link
            to="/settings"
            className={`sliding-menu__list-link ${isActive("/settings")}`}
          >
            <img
              className="sliding-menu__list-icon"
              src="../../../src/assets/icons/settings.svg"
              alt="Settings Icon"
            />
            Settings
          </Link>
        </li>
        <li className="sliding-menu__list-item">
          <Button
            className="sliding-menu__button button--logout"
            onClick={handleLogout}
          >
            <img
              className="sliding-menu__list-icon logout-icon"
              src="../../../src/assets/icons/logout.svg"
              alt="Logout Icon"
            />
            Logout
          </Button>
        </li>
      </ul>
    </aside>
  );
};

export default SlidingMenu;
