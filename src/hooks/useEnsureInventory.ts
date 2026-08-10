import { useEffect } from "react";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore } from "../store/inventoryStore";
import { useHouseholdStream } from "./useHouseholdStream";

/** Load inventory for the current household and keep SSE active. */
export function useEnsureInventory(): void {
  const householdId = useHouseholdStore((s) => s.household?.id);
  const load = useInventoryStore((s) => s.load);
  useHouseholdStream();

  useEffect(() => {
    if (householdId) void load(householdId);
  }, [householdId, load]);
}
