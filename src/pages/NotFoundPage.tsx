import { Link } from "react-router-dom";
import logo from "../assets/logos/website-logo.png";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { useAuthStore } from "../store/authStore";
import "./NotFoundPage.scss";

export default function NotFoundPage() {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const homeTo = isSignedIn ? "/inventory" : "/login";
  const homeLabel = isSignedIn ? "Back to inventory" : "Go to login";

  return (
    <div className="not-found-page">
      <ThemeToggle />
      <main className="not-found-page__panel">
        <div className="not-found-page__logo-wrap">
          <img src={logo} alt="" className="not-found-page__logo" />
        </div>
        <p className="not-found-page__brand">Tori</p>
        <p className="not-found-page__code" aria-hidden="true">
          404
        </p>
        <h1 className="not-found-page__title">Page not found</h1>
        <p className="not-found-page__copy">
          That link does not match anything in Tori. Head back and keep tracking your household.
        </p>
        <div className="not-found-page__actions">
          <Link to={homeTo} className="tori-button tori-button--primary">
            {homeLabel}
          </Link>
          {isSignedIn ? (
            <Link to="/help" className="tori-button tori-button--ghost">
              Open help
            </Link>
          ) : (
            <Link to="/signup" className="tori-button tori-button--ghost">
              Create an account
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
