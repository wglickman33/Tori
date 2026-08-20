import type { ComponentType } from "react";
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
} from "../components/ui/SidebarIcons";

export const MAIN_NAV: { to: string; labelKey: string; icon: ComponentType }[] = [
  { to: "/dashboard", labelKey: "nav.dashboard", icon: IconDashboard },
  { to: "/inventory", labelKey: "nav.inventory", icon: IconInventory },
  { to: "/search", labelKey: "nav.search", icon: IconSearch },
  { to: "/tags", labelKey: "nav.tags", icon: IconTags },
  { to: "/locations", labelKey: "nav.locations", icon: IconLocations },
  { to: "/value", labelKey: "nav.value", icon: IconValue },
  { to: "/expiring", labelKey: "nav.expiring", icon: IconExpiring },
  { to: "/ai", labelKey: "nav.toriAi", icon: IconToriAi },
  { to: "/household", labelKey: "nav.household", icon: IconHousehold },
];

export const META_NAV: { to: string; labelKey: string; icon: ComponentType }[] = [
  { to: "/help", labelKey: "nav.help", icon: IconHelp },
  { to: "/settings", labelKey: "nav.settings", icon: IconSettings },
];
