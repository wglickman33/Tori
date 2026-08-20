export const FOLDER_CATEGORIES = [
  "Electronics",
  "Frozen Food",
  "Refrigerated Food",
  "Unrefrigerated Food",
  "Clothing",
  "Jewelry",
  "Shoes",
  "Sports Equipment",
  "Tools",
  "Custom",
] as const;

/** Folder categories where an expiration date is expected. */
export const FOOD_FOLDER_CATEGORIES = [
  "Frozen Food",
  "Refrigerated Food",
  "Unrefrigerated Food",
] as const;

export function isFoodFolderCategory(category: string | null | undefined): boolean {
  if (!category) return false;
  return (FOOD_FOLDER_CATEGORIES as readonly string[]).includes(category);
}

/** Default household location presets (also seeded on the API). */
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

export const DEFAULT_LOCATION_PRESETS_ES = [
  "Refrigerador de arriba",
  "Refrigerador de abajo",
  "Closet",
  "Gabinete",
  "Escritorio",
  "Cómoda",
  "Ático",
  "Sótano bajo",
  "Despensa",
  "Garaje",
  "Cuarto de lavado",
  "Closet del pasillo",
  "Cobertizo",
] as const;

export function defaultLocationPresetsForLanguage(language?: string | null): string[] {
  return language === "es" ? [...DEFAULT_LOCATION_PRESETS_ES] : [...DEFAULT_LOCATION_PRESETS];
}

/** @deprecated Prefer DEFAULT_LOCATION_PRESETS + household.locationPresets */
export const ITEM_LOCATIONS = [...DEFAULT_LOCATION_PRESETS, "Custom"] as const;
