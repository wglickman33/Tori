import { NavLink } from "react-router-dom";
import { useSidebarStore } from "../../store/sidebarStore";
import { IconHamburger } from "../ui/IconHamburger";
import "../ui/IconHamburger.scss";
import {
  IconDashboard,
  IconExpiring,
  IconHelp,
  IconHousehold,
  IconInventory,
  IconSearch,
  IconSettings,
  IconLocations,
  IconTags,
  IconValue,
  IconToriAi,
} from "../ui/SidebarIcons";
import "./IconSidebar.scss";

const MAIN_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: IconDashboard },
  { to: "/inventory", label: "Inventory", icon: IconInventory },
  { to: "/search", label: "Search", icon: IconSearch },
  { to: "/tags", label: "Tags", icon: IconTags },
  { to: "/locations", label: "Locations", icon: IconLocations },
  { to: "/value", label: "Value", icon: IconValue },
  { to: "/expiring", label: "Expiring", icon: IconExpiring },
  { to: "/ai", label: "Tori AI", icon: IconToriAi },
  { to: "/household", label: "Household", icon: IconHousehold },
] as const;

const META_NAV = [
  { to: "/help", label: "Help", icon: IconHelp },
  { to: "/settings", label: "Settings", icon: IconSettings },
] as const;

export function IconSidebar() {
  const drawerOpen = useSidebarStore((s) => s.drawerOpen);
  const toggleDrawer = useSidebarStore((s) => s.toggleDrawer);
  const closeDrawer = useSidebarStore((s) => s.closeDrawer);

  return (
    <aside
      className={`tori-icon-sidebar${drawerOpen ? " tori-icon-sidebar--menu-open" : ""}`}
      aria-label="Icon navigation"
    >
      <button
        type="button"
        className="tori-icon-sidebar__hamburger"
        onClick={toggleDrawer}
        aria-label={drawerOpen ? "Close menu" : "Open menu"}
        aria-expanded={drawerOpen}
      >
        <IconHamburger open={drawerOpen} />
      </button>

      <nav className="tori-icon-sidebar__nav" aria-label="Primary">
        <ul className="tori-icon-sidebar__list">
          {MAIN_NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `tori-icon-sidebar__link${isActive ? " is-active" : ""}`
                }
                title={label}
                aria-label={label}
                onClick={closeDrawer}
              >
                <Icon />
              </NavLink>
            </li>
          ))}
        </ul>
        <ul className="tori-icon-sidebar__list tori-icon-sidebar__list--meta">
          {META_NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `tori-icon-sidebar__link${isActive ? " is-active" : ""}`
                }
                title={label}
                aria-label={label}
                onClick={closeDrawer}
              >
                <Icon />
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
