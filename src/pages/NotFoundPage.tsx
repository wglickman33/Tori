import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../assets/logos/website-logo.png";
import { ChromeToggles } from "../components/ui/ChromeToggles";
import { useAuthStore } from "../store/authStore";
import "./NotFoundPage.scss";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const homeTo = isSignedIn ? "/inventory" : "/login";
  const homeLabel = isSignedIn ? t("notFound.backInventory") : t("notFound.goLogin");

  return (
    <div className="not-found-page">
      <ChromeToggles variant="floating" />
      <main className="not-found-page__panel">
        <div className="not-found-page__logo-wrap">
          <img src={logo} alt="" className="not-found-page__logo" />
        </div>
        <p className="not-found-page__brand">{t("app.name")}</p>
        <p className="not-found-page__code" aria-hidden="true">
          404
        </p>
        <h1 className="not-found-page__title">{t("notFound.title")}</h1>
        <p className="not-found-page__copy">{t("notFound.copy")}</p>
        <div className="not-found-page__actions">
          <Link to={homeTo} className="tori-button tori-button--primary">
            {homeLabel}
          </Link>
          {isSignedIn ? (
            <Link to="/help" className="tori-button tori-button--ghost">
              {t("notFound.openHelp")}
            </Link>
          ) : (
            <Link to="/signup" className="tori-button tori-button--ghost">
              {t("auth.createAccount")}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
