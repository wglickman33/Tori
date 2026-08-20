import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MAIN_NAV, META_NAV } from "../../constants/nav";
import { useSidebarStore } from "../../store/sidebarStore";
import { IconHamburger } from "../ui/IconHamburger";
import "../ui/IconHamburger.scss";
import "./IconSidebar.scss";

export function IconSidebar() {
  const { t } = useTranslation();
  const drawerOpen = useSidebarStore((s) => s.drawerOpen);
  const toggleDrawer = useSidebarStore((s) => s.toggleDrawer);
  const closeDrawer = useSidebarStore((s) => s.closeDrawer);

  return (
    <aside
      className={`tori-icon-sidebar${drawerOpen ? " tori-icon-sidebar--menu-open" : ""}`}
      aria-label={t("nav.icon")}
    >
      <button
        type="button"
        className="tori-icon-sidebar__hamburger"
        onClick={toggleDrawer}
        aria-label={drawerOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        aria-expanded={drawerOpen}
      >
        <IconHamburger open={drawerOpen} />
      </button>

      <nav className="tori-icon-sidebar__nav" aria-label={t("nav.primary")}>
        <ul className="tori-icon-sidebar__list">
          {MAIN_NAV.map(({ to, labelKey, icon: Icon }) => {
            const label = t(labelKey);
            return (
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
            );
          })}
        </ul>
        <ul className="tori-icon-sidebar__list tori-icon-sidebar__list--meta">
          {META_NAV.map(({ to, labelKey, icon: Icon }) => {
            const label = t(labelKey);
            return (
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
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
