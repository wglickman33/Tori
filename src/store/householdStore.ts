import { create } from "zustand";
import {
  householdsApi,
  type HouseholdMemberRow,
  type HouseholdSummary,
} from "../api/client";

const ACTIVE_KEY = "tori_active_household_id";

function readActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

function writeActiveId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
}

function pickActive(
  households: HouseholdSummary[],
  preferredId?: string | null
): HouseholdSummary | null {
  if (households.length === 0) return null;
  const preferred = preferredId ?? readActiveId();
  return households.find((h) => h.id === preferred) ?? households[0] ?? null;
}

interface HouseholdState {
  households: HouseholdSummary[];
  household: HouseholdSummary | null;
  members: HouseholdMemberRow[];
  isLoading: boolean;
  /** True after a successful /mine response (including empty membership). */
  hasLoadedMine: boolean;
  error: string | null;
  fetchMine: () => Promise<HouseholdSummary | null>;
  selectHousehold: (id: string) => void;
  create: (name: string) => Promise<HouseholdSummary>;
  join: (inviteCode: string) => Promise<HouseholdSummary>;
  regenerateCode: () => Promise<void>;
  rename: (name: string) => Promise<void>;
  updateLocationPresets: (locationPresets: string[]) => Promise<void>;
  applyLocationPresets: (householdId: string, locationPresets: string[]) => void;
  loadMembers: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  leave: () => Promise<void>;
  clear: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  households: [],
  household: null,
  members: [],
  isLoading: false,
  hasLoadedMine: false,
  error: null,

  fetchMine: async () => {
    set({ isLoading: true, error: null });
    try {
      const { households } = await householdsApi.mine();
      const household = pickActive(households);
      writeActiveId(household?.id ?? null);
      set({
        households,
        household,
        isLoading: false,
        hasLoadedMine: true,
        members: [],
        error: null,
      });
      return household;
    } catch (err) {
      // Keep any existing memberships - a transient API/auth blip must not
      // look like "you have no household" and dump the user into onboarding.
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load household",
      });
      return get().household;
    }
  },

  selectHousehold: (id) => {
    const next = get().households.find((h) => h.id === id) ?? null;
    if (!next) return;
    writeActiveId(next.id);
    set({ household: next, members: [] });
  },

  create: async (name) => {
    set({ error: null });
    const { household } = await householdsApi.create(name);
    const households = [...get().households.filter((h) => h.id !== household.id), household];
    writeActiveId(household.id);
    set({ households, household, hasLoadedMine: true, error: null });
    return household;
  },

  join: async (inviteCode) => {
    set({ error: null });
    const { household } = await householdsApi.join(inviteCode);
    const households = [...get().households.filter((h) => h.id !== household.id), household];
    writeActiveId(household.id);
    set({ households, household, hasLoadedMine: true, error: null });
    return household;
  },

  regenerateCode: async () => {
    const current = get().household;
    if (!current || current.role !== "owner") return;
    const { inviteCode } = await householdsApi.regenerateCode(current.id);
    const updated = { ...current, inviteCode };
    set({
      household: updated,
      households: get().households.map((h) => (h.id === updated.id ? updated : h)),
    });
  },

  rename: async (name) => {
    const current = get().household;
    if (!current || current.role !== "owner") throw new Error("Only the owner can rename");
    const { household } = await householdsApi.update(current.id, name);
    set({
      household,
      households: get().households.map((h) => (h.id === household.id ? household : h)),
    });
  },

  updateLocationPresets: async (locationPresets) => {
    const current = get().household;
    if (!current) throw new Error("No household");
    const { household } = await householdsApi.updateLocationPresets(current.id, locationPresets);
    set({
      household,
      households: get().households.map((h) => (h.id === household.id ? household : h)),
    });
  },

  applyLocationPresets: (householdId, locationPresets) => {
    const current = get().household;
    if (!current || current.id !== householdId) return;
    const updated = { ...current, locationPresets };
    set({
      household: updated,
      households: get().households.map((h) => (h.id === householdId ? { ...h, locationPresets } : h)),
    });
  },

  loadMembers: async () => {
    const current = get().household;
    if (!current) {
      set({ members: [] });
      return;
    }
    const { members } = await householdsApi.listMembers(current.id);
    const updated = { ...current, memberCount: members.length };
    set({
      members,
      household: updated,
      households: get().households.map((h) => (h.id === updated.id ? updated : h)),
    });
  },

  removeMember: async (userId) => {
    const current = get().household;
    if (!current) throw new Error("No household");
    await householdsApi.removeMember(current.id, userId);
    const updated = {
      ...current,
      memberCount: Math.max(0, current.memberCount - 1),
    };
    set({
      members: get().members.filter((m) => m.userId !== userId),
      household: updated,
      households: get().households.map((h) => (h.id === updated.id ? updated : h)),
    });
  },

  leave: async () => {
    const current = get().household;
    if (!current) throw new Error("No household");
    await householdsApi.leave(current.id);
    const households = get().households.filter((h) => h.id !== current.id);
    const household = pickActive(households);
    writeActiveId(household?.id ?? null);
    set({ households, household, members: [] });
  },

  clear: () => {
    writeActiveId(null);
    set({
      households: [],
      household: null,
      members: [],
      error: null,
      isLoading: false,
      hasLoadedMine: false,
    });
  },
}));
