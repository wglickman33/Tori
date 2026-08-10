import type { Item } from "../api/client";
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
  if (days === null) return "—";
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}
