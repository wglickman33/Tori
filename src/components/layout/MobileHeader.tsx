import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/logos/website-logo.png";
import { useHouseholdStore } from "../../store/householdStore";
import { useSidebarStore } from "../../store/sidebarStore";
import { IconHamburger } from "../ui/IconHamburger";
import "../ui/IconHamburger.scss";
import { ChromeToggles } from "../ui/ChromeToggles";
import "./MobileHeader.scss";

export function MobileHeader() {
  const { t } = useTranslation();
  const drawerOpen = useSidebarStore((s) => s.drawerOpen);
  const toggleDrawer = useSidebarStore((s) => s.toggleDrawer);
  const household = useHouseholdStore((s) => s.household);
  const homeTo = household ? "/inventory" : "/onboarding";

  return (
    <header className="tori-mobile-header">
      <button
        type="button"
        className="tori-mobile-header__menu"
        onClick={toggleDrawer}
        aria-label={drawerOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        aria-expanded={drawerOpen}
      >
        <IconHamburger open={drawerOpen} />
      </button>
      <Link to={homeTo} className="tori-mobile-header__brand" aria-label={t("nav.home")}>
        <span className="tori-mobile-header__logo-wrap">
          <img src={logo} alt="" className="tori-mobile-header__logo" />
        </span>
        <span className="tori-mobile-header__title">{t("app.name")}</span>
      </Link>
      <ChromeToggles variant="header" />
    </header>
  );
}
