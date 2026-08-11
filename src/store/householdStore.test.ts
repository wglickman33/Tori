import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HouseholdSummary } from "../api/client";
import { useHouseholdStore } from "./householdStore";

const sampleHousehold = (overrides: Partial<HouseholdSummary> = {}): HouseholdSummary => ({
  id: "h1",
  name: "Home",
  role: "owner",
  ownerId: "u1",
  memberCount: 1,
  inviteCode: "ABCD1234",
  locationPresets: ["Pantry"],
  ...overrides,
});

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    householdsApi: {
      mine: vi.fn(),
      create: vi.fn(),
      join: vi.fn(),
      update: vi.fn(),
      updateLocationPresets: vi.fn(),
      listMembers: vi.fn(),
      removeMember: vi.fn(),
      leave: vi.fn(),
      regenerateCode: vi.fn(),
      get: vi.fn(),
    },
  };
});

describe("householdStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useHouseholdStore.getState().clear();
    vi.clearAllMocks();
  });

  it("create and join set active household", async () => {
    const { householdsApi } = await import("../api/client");
    const created = sampleHousehold({ id: "h-create", name: "Created" });
    vi.mocked(householdsApi.create).mockResolvedValue({ household: created });

    await useHouseholdStore.getState().create("Created");
    expect(useHouseholdStore.getState().household?.id).toBe("h-create");
    expect(localStorage.getItem("tori_active_household_id")).toBe("h-create");

    const joined = sampleHousehold({
      id: "h-join",
      name: "Joined",
      role: "member",
      inviteCode: null,
    });
    vi.mocked(householdsApi.join).mockResolvedValue({ household: joined });
    await useHouseholdStore.getState().join("CODECODE");
    expect(useHouseholdStore.getState().household?.id).toBe("h-join");
  });

  it("renames and regenerates invite code for owner", async () => {
    const { householdsApi } = await import("../api/client");
    const current = sampleHousehold();
    useHouseholdStore.setState({
      households: [current],
      household: current,
      hasLoadedMine: true,
    });

    vi.mocked(householdsApi.update).mockResolvedValue({
      household: { ...current, name: "Renamed" },
    });
    await useHouseholdStore.getState().rename("Renamed");
    expect(useHouseholdStore.getState().household?.name).toBe("Renamed");

    vi.mocked(householdsApi.regenerateCode).mockResolvedValue({ inviteCode: "NEWCODE1" });
    await useHouseholdStore.getState().regenerateCode();
    expect(useHouseholdStore.getState().household?.inviteCode).toBe("NEWCODE1");
  });

  it("updates location presets and removes members", async () => {
    const { householdsApi } = await import("../api/client");
    const current = sampleHousehold({ memberCount: 2 });
    useHouseholdStore.setState({
      households: [current],
      household: current,
      members: [
        {
          userId: "u1",
          displayName: "You",
          email: "you@example.com",
          role: "owner",
          joinedAt: "2026-01-01",
        },
        {
          userId: "u2",
          displayName: "Other",
          email: "other@example.com",
          role: "member",
          joinedAt: "2026-01-02",
        },
      ],
    });

    vi.mocked(householdsApi.updateLocationPresets).mockResolvedValue({
      household: { ...current, locationPresets: ["Garage"] },
    });
    await useHouseholdStore.getState().updateLocationPresets(["Garage"]);
    expect(useHouseholdStore.getState().household?.locationPresets).toEqual(["Garage"]);

    vi.mocked(householdsApi.removeMember).mockResolvedValue(undefined);
    await useHouseholdStore.getState().removeMember("u2");
    expect(useHouseholdStore.getState().members).toHaveLength(1);
    expect(useHouseholdStore.getState().household?.memberCount).toBe(1);
  });

  it("leave clears the current household", async () => {
    const { householdsApi } = await import("../api/client");
    const current = sampleHousehold();
    useHouseholdStore.setState({
      households: [current],
      household: current,
      members: [],
    });
    vi.mocked(householdsApi.leave).mockResolvedValue(undefined);

    await useHouseholdStore.getState().leave();

    expect(householdsApi.leave).toHaveBeenCalledWith("h1");
    expect(useHouseholdStore.getState().household).toBeNull();
    expect(useHouseholdStore.getState().households).toHaveLength(0);
  });
});
