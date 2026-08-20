import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import logo from "../../assets/logos/website-logo.png";
import { ChromeToggles } from "../ui/ChromeToggles";
import "./AuthLayout.scss";

export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="auth-layout">
      <ChromeToggles variant="floating" />
      <aside className="auth-layout__brand">
        <div className="auth-layout__logo-wrap">
          <img src={logo} alt="" className="auth-layout__logo" />
        </div>
        <div className="auth-layout__copy">
          <p className="auth-layout__name">{t("app.name")}</p>
          <p className="auth-layout__tagline">{t("app.tagline")}</p>
        </div>
      </aside>
      <div className="auth-layout__card">{children}</div>
    </div>
  );
}
