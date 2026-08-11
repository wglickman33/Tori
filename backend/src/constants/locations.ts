/** Default household location presets (mirrors client DEFAULT_LOCATION_PRESETS). */
export const DEFAULT_LOCATION_PRESETS = [
  "Upstairs Fridge",
  "Downstairs Fridge",
  "Closet",
  "Cabinet",
  "Desk",
  "Dresser",
  "Attic",
  "Crawl Space",
  "Pantry",
  "Garage",
  "Laundry Room",
  "Hallway Closet",
  "Shed",
] as const;

export function normalizeLocationPresets(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [...DEFAULT_LOCATION_PRESETS];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (!trimmed || trimmed.toLowerCase() === "custom") continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}
