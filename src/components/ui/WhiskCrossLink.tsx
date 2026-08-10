import whiskLogo from "../../assets/logos/whiskLogoAmber.svg";
import { getWhiskUrl } from "../../utils/whiskUrl";
import "./WhiskCrossLink.scss";

interface WhiskCrossLinkProps {
  variant?: "card" | "inline";
}

export function WhiskCrossLink({ variant = "card" }: WhiskCrossLinkProps) {
  const href = getWhiskUrl();

  if (variant === "inline") {
    return (
      <a
        className="whisk-cross-link whisk-cross-link--inline"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Whisk"
      >
        <img src={whiskLogo} alt="" className="whisk-cross-link__mark" />
        Whisk
      </a>
    );
  }

  return (
    <aside className="whisk-cross-link whisk-cross-link--card">
      <div className="whisk-cross-link__brand">
        <img src={whiskLogo} alt="" className="whisk-cross-link__logo" />
        <div className="whisk-cross-link__copy">
          <h2 className="whisk-cross-link__title">Explore Whisk</h2>
          <p className="whisk-cross-link__body">
            Recipes and shopping lists for the same household — separate app, no shared login.
          </p>
        </div>
      </div>
      <a
        className="whisk-cross-link__cta"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        Open Whisk
      </a>
    </aside>
  );
}
