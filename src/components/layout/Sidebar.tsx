import { Link, NavLink, useNavigate } from "react-router-dom";
import logo from "../../assets/logos/website-logo.png";
import { BP_DESKTOP } from "../../constants/breakpoints";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { useAuthStore } from "../../store/authStore";
import { useHouseholdStore } from "../../store/householdStore";
import { useInventoryStore } from "../../store/inventoryStore";
import { useSidebarStore } from "../../store/sidebarStore";
import { IconHamburger } from "../ui/IconHamburger";
import "../ui/IconHamburger.scss";
import {
  IconDashboard,
  IconExpiring,
  IconHelp,
  IconHousehold,
  IconInventory,
  IconLogout,
  IconSearch,
  IconSettings,
  IconLocations,
  IconTags,
  IconUser,
  IconValue,
} from "../ui/SidebarIcons";
import { ThemeToggle } from "../ui/ThemeToggle";
import { HouseholdSwitcher } from "./HouseholdSwitcher";
import "./Sidebar.scss";

const MAIN_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { to: "/inventory", label: "Inventory", icon: IconInventory },
  { to: "/search", label: "Search", icon: IconSearch },
  { to: "/tags", label: "Tags", icon: IconTags },
  { to: "/locations", label: "Locations", icon: IconLocations },
  { to: "/value", label: "Value", icon: IconValue },
  { to: "/expiring", label: "Expiring", icon: IconExpiring },
  { to: "/household", label: "Household", icon: IconHousehold },
] as const;

const META_NAV = [
  { to: "/help", label: "Help", icon: IconHelp },
  { to: "/settings", label: "Settings", icon: IconSettings },
] as const;

export function Sidebar() {
  const width = useWindowWidth();
  const isDesktop = width > BP_DESKTOP;
  const expanded = useSidebarStore((s) => s.expanded);
  const toggle = useSidebarStore((s) => s.toggle);
  const drawerOpen = useSidebarStore((s) => s.drawerOpen);
  const closeDrawer = useSidebarStore((s) => s.closeDrawer);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const clearHousehold = useHouseholdStore((s) => s.clear);
  const clearInventory = useInventoryStore((s) => s.clear);
  const household = useHouseholdStore((s) => s.household);
  const homeTo = household ? "/inventory" : "/onboarding";
  const showExpanded = isDesktop ? expanded : true;

  const handleLinkClick = () => {
    if (!isDesktop) closeDrawer();
  };

  const onLogout = async () => {
    clearInventory();
    clearHousehold();
    await signOut();
    closeDrawer();
    navigate("/login");
  };

  return (
    <aside
      className={[
        "tori-sidebar",
        showExpanded ? "tori-sidebar--expanded" : "tori-sidebar--collapsed",
        !isDesktop ? "tori-sidebar--overlay" : "",
        !isDesktop && drawerOpen ? "tori-sidebar--overlay-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Site navigation"
    >
      <div className="tori-sidebar__header">
        <Link
          to={homeTo}
          className={`tori-sidebar__brand${showExpanded ? "" : " tori-sidebar__brand--icon"}`}
          aria-label={showExpanded ? undefined : "Tori home"}
          onClick={handleLinkClick}
        >
          <span className="tori-sidebar__logo-wrap">
            <img src={logo} alt="" className="tori-sidebar__logo" />
          </span>
          {showExpanded ? (
            <span className="tori-sidebar__brand-text">
              <span className="tori-sidebar__title">Tori</span>
            </span>
          ) : null}
        </Link>
        <button
          type="button"
          className="tori-sidebar__toggle"
          onClick={isDesktop ? toggle : closeDrawer}
          aria-label={
            isDesktop
              ? showExpanded
                ? "Collapse sidebar"
                : "Expand sidebar"
              : "Close menu"
          }
        >
          <IconHamburger open={showExpanded || (!isDesktop && drawerOpen)} />
        </button>
      </div>

      <div className="tori-sidebar__switcher">
        <HouseholdSwitcher collapsed={!showExpanded} />
      </div>

      <nav className="tori-sidebar__nav" aria-label="Primary">
        <ul className="tori-sidebar__list">
          {MAIN_NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `tori-sidebar__link${isActive ? " is-active" : ""}`
                }
                title={!showExpanded ? label : undefined}
                aria-label={label}
                onClick={handleLinkClick}
              >
                <span className="tori-sidebar__link-icon">
                  <Icon />
                </span>
                {showExpanded ? <span className="tori-sidebar__link-label">{label}</span> : null}
              </NavLink>
            </li>
          ))}
        </ul>

        <ul className="tori-sidebar__list tori-sidebar__list--meta">
          {META_NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `tori-sidebar__link${isActive ? " is-active" : ""}`
                }
                title={!showExpanded ? label : undefined}
                aria-label={label}
                onClick={handleLinkClick}
              >
                <span className="tori-sidebar__link-icon">
                  <Icon />
                </span>
                {showExpanded ? <span className="tori-sidebar__link-label">{label}</span> : null}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="tori-sidebar__footer">
        <div className="tori-sidebar__tools">
          <ThemeToggle variant="header" />
          <button
            type="button"
            className="tori-sidebar__logout"
            onClick={onLogout}
            title="Log out"
            aria-label="Log out"
          >
            <IconLogout />
            {showExpanded ? <span>Log out</span> : null}
          </button>
        </div>
        <div className="tori-sidebar__user">
          <span className="tori-sidebar__avatar" aria-hidden>
            <IconUser />
          </span>
          {showExpanded ? (
            <span className="tori-sidebar__user-name">{user?.displayName ?? "Signed in"}</span>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
