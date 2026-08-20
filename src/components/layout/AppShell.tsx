import type { CSSProperties, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BP_DESKTOP, BP_TABLET } from "../../constants/breakpoints";
import { useWindowWidth } from "../../hooks/useWindowWidth";
import { useSidebarStore } from "../../store/sidebarStore";
import { FloatingAppsMenu } from "../ui/FloatingAppsMenu";
import { NotificationToastContainer } from "../ui/NotificationToast";
import { ToriWidget } from "../tori/ToriWidget";
import { IconSidebar } from "./IconSidebar";
import { MobileHeader } from "./MobileHeader";
import { Sidebar } from "./Sidebar";
import "./AppShell.scss";

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const width = useWindowWidth();
  const expanded = useSidebarStore((s) => s.expanded);
  const drawerOpen = useSidebarStore((s) => s.drawerOpen);
  const closeDrawer = useSidebarStore((s) => s.closeDrawer);

  const isDesktop = width > BP_DESKTOP;
  const isTablet = width > BP_TABLET && width <= BP_DESKTOP;
  const isMobile = width <= BP_TABLET;

  let mainMod = "app-shell__main--mobile";
  let sidebarWidthPx = 0;
  if (isDesktop) {
    mainMod = expanded ? "app-shell__main--desktop-expanded" : "app-shell__main--desktop-collapsed";
    sidebarWidthPx = expanded ? 240 : 60;
  } else if (isTablet) {
    mainMod = "app-shell__main--tablet";
    sidebarWidthPx = 60;
  }

  return (
    <div
      className="app-shell"
      style={{ "--sidebar-width": `${sidebarWidthPx}px` } as CSSProperties}
    >
      {!isDesktop && drawerOpen ? (
        <button
          type="button"
          className="app-shell__backdrop"
          aria-label={t("nav.closeMenu")}
          onClick={closeDrawer}
        />
      ) : null}

      <Sidebar />
      <IconSidebar />

      <div className={`app-shell__main ${mainMod}`}>
        {isMobile ? <MobileHeader /> : null}
        <div className="app-shell__content">{children}</div>
      </div>

      <FloatingAppsMenu />
      <ToriWidget />
      <NotificationToastContainer />
    </div>
  );
}
