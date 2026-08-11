import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  expanded: boolean;
  drawerOpen: boolean;
  toggle: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      expanded: true,
      drawerOpen: false,
      toggle: () => set((s) => ({ expanded: !s.expanded })),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      toggleDrawer: () => set((s) => ({ drawerOpen: !s.drawerOpen })),
    }),
    { name: "tori-sidebar", partialize: (s) => ({ expanded: s.expanded }) }
  )
);
