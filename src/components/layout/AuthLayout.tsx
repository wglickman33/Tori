import type { ReactNode } from "react";
import logo from "../../assets/logos/website-logo.png";
import "./AuthLayout.scss";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="auth-layout__brand">
        <div className="auth-layout__logo-wrap">
          <img src={logo} alt="" className="auth-layout__logo" />
        </div>
        <div className="auth-layout__copy">
          <p className="auth-layout__name">Tori</p>
          <p className="auth-layout__tagline">Home inventory for your household</p>
        </div>
      </aside>
      <div className="auth-layout__card">{children}</div>
    </div>
  );
}
