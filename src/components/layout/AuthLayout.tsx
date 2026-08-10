import type { ReactNode } from "react";
import logo from "../../assets/logos/tori-logo.svg";
import "./AuthLayout.scss";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <img src={logo} alt="Tori" className="auth-layout__logo" />
        <span className="auth-layout__name">Tori</span>
      </div>
      <div className="auth-layout__card">{children}</div>
    </div>
  );
}
