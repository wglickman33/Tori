import type { Item } from "../api/client";
import i18n from "../i18n";
import { daysUntilExpiration } from "./inventoryFilters";

export const EXPIRING_THRESHOLD_KEY = "tori_expiring_threshold_days";
export const DEFAULT_EXPIRING_THRESHOLD = 7;

export function readExpiringThreshold(): number {
  const raw = localStorage.getItem(EXPIRING_THRESHOLD_KEY);
  if (raw === null) return DEFAULT_EXPIRING_THRESHOLD;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 365) return DEFAULT_EXPIRING_THRESHOLD;
  return n;
}

export function writeExpiringThreshold(days: number): void {
  localStorage.setItem(EXPIRING_THRESHOLD_KEY, String(days));
}

export function filterExpiringItems(items: Item[], thresholdDays: number, today = new Date()): Item[] {
  return items
    .map((item) => ({ item, days: daysUntilExpiration(item.expirationDate, today) }))
    .filter((row) => row.days !== null && row.days <= thresholdDays)
    .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
    .map((row) => row.item);
}

export function expirationLabel(expirationDate: string | null, today = new Date()): string {
  const days = daysUntilExpiration(expirationDate, today);
  if (days === null) return i18n.t("common.dash");
  if (days < 0) return i18n.t("expiry.overdue");
  if (days === 0) return i18n.t("expiry.today");
  if (days === 1) return i18n.t("expiry.day");
  return i18n.t("expiry.days", { count: days });
}
