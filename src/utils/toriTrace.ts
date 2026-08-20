import { formatMoney } from "./inventoryValue";

export const TORI_TOOL_LABELS: Record<string, string> = {
  search_items: "Searching inventory",
  get_item: "Reading item",
  get_expiring: "Checking what's expiring",
  list_locations: "Listing locations",
  items_in_location: "Listing items in a location",
  list_tags: "Listing tags",
  items_with_tag: "Listing tagged items",
  get_inventory_value: "Checking recorded value",
  list_folders: "Listing folders",
  propose_add_item: "Proposing an add",
  propose_update_item: "Proposing an update",
  propose_delete_item: "Proposing a delete",
};

export function toriToolLabel(name: string): string {
  return TORI_TOOL_LABELS[name] ?? name.replaceAll("_", " ");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function itemName(value: unknown): string {
  const rec = asRecord(value);
  const name = rec?.name;
  return typeof name === "string" ? name.trim() : "";
}

function countLabel(count: number, singular: string, plural: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}

export function summarizeToriInput(name: string, input: unknown): string {
  const rec = asRecord(input);
  if (!rec) return "";
  if (name === "search_items" && typeof rec.query === "string") return rec.query.trim();
  if (name === "get_item") return "Saved item";
  if (name === "get_expiring") {
    const days = typeof rec.within_days === "number" ? rec.within_days : 7;
    if (days === 0) return "Today and overdue";
    return `Next ${days} days`;
  }
  if (name === "items_in_location" && typeof rec.location === "string") return rec.location.trim();
  if (name === "items_with_tag" && typeof rec.tag === "string") return rec.tag.trim();
  if (name === "propose_add_item" && typeof rec.name === "string") return rec.name.trim();
  if (name === "propose_update_item" && typeof rec.name === "string") return rec.name.trim();
  return "";
}

export function summarizeToriOutput(name: string, output: unknown): string {
  const rec = asRecord(output);
  if (!rec) return "";
  if (typeof rec.error === "string" && rec.error.trim()) return rec.error.trim();

  if (name === "search_items") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    if (count <= 0) return "No matching items";
    return `Found ${countLabel(count, "item", "items")}`;
  }

  if (name === "get_item") {
    const named = itemName(rec.item);
    return named || "Item";
  }

  if (name === "get_expiring") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    if (count <= 0) return "Nothing expiring in that window";
    return countLabel(count, "expiring item", "expiring items");
  }

  if (name === "list_locations") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    return countLabel(count, "location", "locations");
  }

  if (name === "items_in_location") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    const location = typeof rec.location === "string" && rec.location.trim() ? rec.location.trim() : "that location";
    if (count <= 0) return `No items in ${location}`;
    return `${countLabel(count, "item", "items")} in ${location}`;
  }

  if (name === "list_tags") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    return countLabel(count, "tag", "tags");
  }

  if (name === "items_with_tag") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    const tag = typeof rec.tag === "string" && rec.tag.trim() ? rec.tag.trim() : "that tag";
    if (count <= 0) return `No items tagged ${tag}`;
    return `${countLabel(count, "item", "items")} tagged ${tag}`;
  }

  if (name === "get_inventory_value") {
    const pricedCount = typeof rec.pricedCount === "number" ? rec.pricedCount : 0;
    if (pricedCount <= 0) return "No recorded prices";
    const total = typeof rec.totalValue === "number" ? rec.totalValue : 0;
    return `Recorded total ${formatMoney(total)} from ${countLabel(pricedCount, "priced item", "priced items")}`;
  }

  if (name === "list_folders") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    return countLabel(count, "folder", "folders");
  }

  if (name === "propose_add_item" || name === "propose_update_item" || name === "propose_delete_item") {
    if (rec.needsConfirmation) {
      const named =
        itemName(rec.item) ||
        (typeof rec.itemName === "string" ? rec.itemName.trim() : "");
      return named ? `Waiting for you to confirm · ${named}` : "Waiting for you to confirm";
    }
    return "Proposed change";
  }

  return "";
}

export type ToriTraceStep = {
  id: string;
  name: string;
  input: unknown;
  output?: unknown;
  status: "running" | "done";
};

export function applyToriTraceEvent(
  steps: ToriTraceStep[],
  event: { type: string; id?: string; name?: string; input?: unknown; output?: unknown }
): ToriTraceStep[] {
  if (event.type === "tool.start" && event.id && event.name) {
    const next: ToriTraceStep = {
      id: event.id,
      name: event.name,
      input: event.input,
      status: "running",
    };
    const index = steps.findIndex((step) => step.id === event.id);
    if (index < 0) return [...steps, next];
    const copy = [...steps];
    copy[index] = next;
    return copy;
  }
  if (event.type === "tool.result" && event.id) {
    return steps.map((step) =>
      step.id === event.id ? { ...step, output: event.output, status: "done" } : step
    );
  }
  return steps;
}
