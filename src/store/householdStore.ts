import { create } from "zustand";
import {
  householdsApi,
  type HouseholdMemberRow,
  type HouseholdSummary,
} from "../api/client";

interface HouseholdState {
  household: HouseholdSummary | null;
  members: HouseholdMemberRow[];
  isLoading: boolean;
  error: string | null;
  fetchMine: () => Promise<HouseholdSummary | null>;
  create: (name: string) => Promise<HouseholdSummary>;
  join: (inviteCode: string) => Promise<HouseholdSummary>;
  regenerateCode: () => Promise<void>;
  rename: (name: string) => Promise<void>;
  loadMembers: () => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  leave: () => Promise<void>;
  clear: () => void;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  household: null,
  members: [],
  isLoading: false,
  error: null,

  fetchMine: async () => {
    set({ isLoading: true, error: null });
    try {
      const { household } = await householdsApi.mine();
      set({ household, isLoading: false });
      return household;
    } catch (err) {
      set({
        household: null,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load household",
      });
      return null;
    }
  },

  create: async (name) => {
    set({ error: null });
    const { household } = await householdsApi.create(name);
    set({ household });
    return household;
  },

  join: async (inviteCode) => {
    set({ error: null });
    const { household } = await householdsApi.join(inviteCode);
    set({ household });
    return household;
  },

  regenerateCode: async () => {
    const current = get().household;
    if (!current || current.role !== "owner") return;
    const { inviteCode } = await householdsApi.regenerateCode(current.id);
    set({ household: { ...current, inviteCode } });
  },

  rename: async (name) => {
    const current = get().household;
    if (!current || current.role !== "owner") throw new Error("Only the owner can rename");
    const { household } = await householdsApi.update(current.id, name);
    set({ household });
  },

  loadMembers: async () => {
    const current = get().household;
    if (!current) {
      set({ members: [] });
      return;
    }
    const { members } = await householdsApi.listMembers(current.id);
    set({ members, household: { ...current, memberCount: members.length } });
  },

  removeMember: async (userId) => {
    const current = get().household;
    if (!current) throw new Error("No household");
    await householdsApi.removeMember(current.id, userId);
    set({
      members: get().members.filter((m) => m.userId !== userId),
      household: { ...current, memberCount: Math.max(0, current.memberCount - 1) },
    });
  },

  leave: async () => {
    const current = get().household;
    if (!current) throw new Error("No household");
    await householdsApi.leave(current.id);
    set({ household: null, members: [] });
  },

  clear: () => set({ household: null, members: [], error: null, isLoading: false }),
}));
