import { Link } from "react-router-dom";
import "./Button.scss";

const Button = ({
  to,
  children,
  className = "",
  onClick,
  type = "button",
  iconSrc,
  iconAlt,
  onlyIcon = false,
}) => {
  const buttonClass = `button ${className}`.trim();

  const iconEl = iconSrc && (
    <img src={iconSrc} alt={iconAlt} className="button__icon" />
  );

  const buttonBase = (
    <button type={type} className={buttonClass} onClick={onClick}>
      {iconEl}
      {!onlyIcon && <span className="button__text">{children}</span>}
    </button>
  );

  if (to) {
    return (
      <Link to={to} className="button__link">
        {buttonBase}
      </Link>
    );
  }

  return buttonBase;
};

export default Button;
