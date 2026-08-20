import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/logos/website-logo.png";
import { BP_DESKTOP } from "../../constants/breakpoints";
import { MAIN_NAV, META_NAV } from "../../constants/nav";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { useAuthStore } from "../../store/authStore";
import { useHouseholdStore } from "../../store/householdStore";
import { useInventoryStore } from "../../store/inventoryStore";
import { useSidebarStore } from "../../store/sidebarStore";
import { IconHamburger } from "../ui/IconHamburger";
import "../ui/IconHamburger.scss";
import { IconLogout, IconUser } from "../ui/SidebarIcons";
import { ChromeToggles } from "../ui/ChromeToggles";
import { HouseholdSwitcher } from "./HouseholdSwitcher";
import "./Sidebar.scss";

export function Sidebar() {
  const { t } = useTranslation();
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
      aria-label={t("nav.site")}
    >
      <div className="tori-sidebar__header">
        <Link
          to={homeTo}
          className={`tori-sidebar__brand${showExpanded ? "" : " tori-sidebar__brand--icon"}`}
          aria-label={showExpanded ? undefined : t("nav.home")}
          onClick={handleLinkClick}
        >
          <span className="tori-sidebar__logo-wrap">
            <img src={logo} alt="" className="tori-sidebar__logo" />
          </span>
          {showExpanded ? (
            <span className="tori-sidebar__brand-text">
              <span className="tori-sidebar__title">{t("app.name")}</span>
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
                ? t("nav.collapseSidebar")
                : t("nav.expandSidebar")
              : t("nav.closeMenu")
          }
        >
          <IconHamburger open={showExpanded || (!isDesktop && drawerOpen)} />
        </button>
      </div>

      <div className="tori-sidebar__switcher">
        <HouseholdSwitcher collapsed={!showExpanded} />
      </div>

      <nav className="tori-sidebar__nav" aria-label={t("nav.primary")}>
        <ul className="tori-sidebar__list">
          {MAIN_NAV.map(({ to, labelKey, icon: Icon }) => {
            const label = t(labelKey);
            return (
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
            );
          })}
        </ul>

        <ul className="tori-sidebar__list tori-sidebar__list--meta">
          {META_NAV.map(({ to, labelKey, icon: Icon }) => {
            const label = t(labelKey);
            return (
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
            );
          })}
        </ul>
      </nav>

      <div className="tori-sidebar__footer">
        <div className="tori-sidebar__account">
          <div className="tori-sidebar__user">
            <span className="tori-sidebar__avatar" aria-hidden>
              <IconUser />
            </span>
            {showExpanded ? (
              <span className="tori-sidebar__user-name">{user?.displayName ?? t("nav.signedIn")}</span>
            ) : null}
          </div>
          <div className="tori-sidebar__tools">
            <ChromeToggles variant={showExpanded ? "header" : "compact"} />
            <button
              type="button"
              className="tori-sidebar__logout"
              onClick={onLogout}
              title={t("nav.logOut")}
              aria-label={t("nav.logOut")}
            >
              <IconLogout />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
