import i18n from "../i18n";
import { formatMoney } from "./inventoryValue";

export function toriToolLabel(name: string): string {
  const key = `trace.${name}`;
  const translated = i18n.t(key);
  return translated === key ? name.replaceAll("_", " ") : translated;
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

export function summarizeToriInput(name: string, input: unknown): string {
  const rec = asRecord(input);
  if (!rec) return "";
  if (name === "search_items" && typeof rec.query === "string") return rec.query.trim();
  if (name === "get_item") return i18n.t("trace.savedItem");
  if (name === "get_expiring") {
    const days = typeof rec.within_days === "number" ? rec.within_days : 7;
    if (days === 0) return i18n.t("trace.todayOverdue");
    return i18n.t("trace.nextDays", { count: days });
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
    if (count <= 0) return i18n.t("trace.noMatching");
    return i18n.t("trace.foundItems", { count });
  }

  if (name === "get_item") {
    const named = itemName(rec.item);
    return named || i18n.t("trace.item");
  }

  if (name === "get_expiring") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    if (count <= 0) return i18n.t("trace.nothingExpiring");
    return i18n.t("trace.expiringItem", { count });
  }

  if (name === "list_locations") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    return i18n.t("trace.location", { count });
  }

  if (name === "items_in_location") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    const location =
      typeof rec.location === "string" && rec.location.trim()
        ? rec.location.trim()
        : i18n.t("trace.thatLocation");
    if (count <= 0) return i18n.t("trace.noItemsIn", { location });
    return i18n.t("trace.itemsIn", { count, location });
  }

  if (name === "list_tags") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    return i18n.t("trace.tag", { count });
  }

  if (name === "items_with_tag") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    const tag =
      typeof rec.tag === "string" && rec.tag.trim() ? rec.tag.trim() : i18n.t("trace.thatTag");
    if (count <= 0) return i18n.t("trace.noItemsTagged", { tag });
    return i18n.t("trace.itemsTagged", { count, tag });
  }

  if (name === "get_inventory_value") {
    const pricedCount = typeof rec.pricedCount === "number" ? rec.pricedCount : 0;
    if (pricedCount <= 0) return i18n.t("trace.noPrices");
    const total = typeof rec.totalValue === "number" ? rec.totalValue : 0;
    return i18n.t("trace.recordedTotal", { total: formatMoney(total), count: pricedCount });
  }

  if (name === "list_folders") {
    const count = typeof rec.count === "number" ? rec.count : 0;
    return i18n.t("trace.folder", { count });
  }

  if (name === "propose_add_item" || name === "propose_update_item" || name === "propose_delete_item") {
    if (rec.needsConfirmation) {
      const named =
        itemName(rec.item) || (typeof rec.itemName === "string" ? rec.itemName.trim() : "");
      return named ? i18n.t("trace.waitingNamed", { name: named }) : i18n.t("trace.waiting");
    }
    return i18n.t("trace.proposed");
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
