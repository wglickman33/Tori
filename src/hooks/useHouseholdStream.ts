import { useEffect, useRef } from "react";
import { getAccessToken, inventoryApi } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useHouseholdStore } from "../store/householdStore";
import { useInventoryStore, type HouseholdStreamEvent } from "../store/inventoryStore";

const STREAM_EVENTS: HouseholdStreamEvent["type"][] = [
  "folder.created",
  "folder.updated",
  "folder.deleted",
  "item.created",
  "item.updated",
  "item.deleted",
  "membership.revoked",
];

function parseEvent(raw: string): HouseholdStreamEvent | null {
  try {
    return JSON.parse(raw) as HouseholdStreamEvent;
  } catch {
    return null;
  }
}

export function useHouseholdStream(): void {
  const isSignedIn = useAuthStore((s) => s.isSignedIn);
  const isLoading = useAuthStore((s) => s.isLoading);
  const householdId = useHouseholdStore((s) => s.household?.id);
  const clearHousehold = useHouseholdStore((s) => s.clear);
  const applyEvent = useInventoryStore((s) => s.applyEvent);
  const clearInventory = useInventoryStore((s) => s.clear);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isSignedIn || isLoading || !householdId) return;
    const token = getAccessToken();
    if (!token) return;

    const source = new EventSource(inventoryApi.eventsUrl(householdId, token));
    sourceRef.current = source;

    for (const type of STREAM_EVENTS) {
      source.addEventListener(type, (message) => {
        const event = parseEvent((message as MessageEvent).data);
        if (!event) return;
        if (event.type === "membership.revoked") {
          clearInventory();
          clearHousehold();
          return;
        }
        applyEvent(event);
      });
    }

    return () => {
      source.close();
      sourceRef.current = null;
    };
  }, [applyEvent, clearHousehold, clearInventory, householdId, isLoading, isSignedIn]);
}
