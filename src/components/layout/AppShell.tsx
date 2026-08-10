import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logos/website-logo.png";
import { useAuthStore } from "../../store/authStore";
import { useHouseholdStore } from "../../store/householdStore";
import { useInventoryStore } from "../../store/inventoryStore";
import { Button } from "../ui/Button";
import { WhiskCrossLink } from "../ui/WhiskCrossLink";
import "./AppShell.scss";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/inventory", label: "Inventory" },
  { to: "/search", label: "Search" },
  { to: "/tags", label: "Tags" },
  { to: "/expiring", label: "Expiring" },
  { to: "/household", label: "Household" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const clearHousehold = useHouseholdStore((s) => s.clear);
  const clearInventory = useInventoryStore((s) => s.clear);
  const household = useHouseholdStore((s) => s.household);

  const onLogout = async () => {
    clearInventory();
    clearHousehold();
    await signOut();
    navigate("/login");
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <img src={logo} alt="Tori" className="app-shell__logo" />
          <div>
            <div className="app-shell__title">Tori</div>
            <div className="app-shell__household">{household?.name ?? "Household"}</div>
          </div>
        </div>

        <nav className="app-shell__nav" aria-label="Primary">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `app-shell__nav-link${isActive ? " is-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="app-shell__user">
          <NavLink to="/help" className="app-shell__meta-link">
            Help
          </NavLink>
          <NavLink to="/settings" className="app-shell__meta-link">
            Settings
          </NavLink>
          <WhiskCrossLink variant="inline" />
          <span className="app-shell__user-name">{user?.displayName}</span>
          <Button type="button" variant="ghost" onClick={onLogout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="app-shell__main">{children}</main>
    </div>
  );
}
