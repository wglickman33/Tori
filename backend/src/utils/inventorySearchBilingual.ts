import {
  DEFAULT_LOCATION_PRESETS,
  DEFAULT_LOCATION_PRESETS_ES,
} from "../constants/locations.js";

/** Common household inventory phrases and tokens (ES ↔ EN). */
const HOUSEHOLD_PHRASES: readonly (readonly [string, string])[] = [
  ["botella de agua", "water bottle"],
  ["botellas de agua", "water bottles"],
  ["cargador", "charger"],
  ["cargadores", "chargers"],
  ["cargador de iphone", "iphone charger"],
  ["cargador de teléfono", "phone charger"],
  ["cargador de telefono", "phone charger"],
  ["toallas de papel", "paper towels"],
  ["papel higiénico", "toilet paper"],
  ["papel higienico", "toilet paper"],
  ["leche", "milk"],
  ["hub", "hub"],
  ["teléfono", "phone"],
  ["telefono", "phone"],
  ["celular", "phone"],
  ["computadora", "computer"],
  ["ordenador", "computer"],
  ["refrigerador", "fridge"],
  ["nevera", "fridge"],
  ["congelador", "freezer"],
  ["batería", "battery"],
  ["bateria", "battery"],
  ["pilas", "batteries"],
  ["pila", "battery"],
  ["medicina", "medicine"],
  ["medicamentos", "medicine"],
  ["aspirina", "aspirin"],
  ["detergente", "detergent"],
  ["jabón", "soap"],
  ["jabon", "soap"],
  ["champú", "shampoo"],
  ["champu", "shampoo"],
  ["pasta de dientes", "toothpaste"],
  ["café", "coffee"],
  ["cafe", "coffee"],
  ["arroz", "rice"],
  ["pasta", "pasta"],
  ["salsa", "sauce"],
  ["aceite", "oil"],
  ["mantequilla", "butter"],
  ["yogur", "yogurt"],
  ["huevo", "egg"],
  ["huevos", "eggs"],
  ["pan", "bread"],
  ["queso", "cheese"],
  ["carne", "meat"],
  ["pollo", "chicken"],
  ["pescado", "fish"],
  ["verduras", "vegetables"],
  ["fruta", "fruit"],
  ["frutas", "fruit"],
  ["snacks", "snacks"],
  ["galletas", "cookies"],
  ["cereal", "cereal"],
  ["té", "tea"],
  ["te", "tea"],
  ["agua", "water"],
  ["lámpara", "lamp"],
  ["lampara", "lamp"],
  ["televisión", "television"],
  ["television", "television"],
  ["tv", "tv"],
  ["control remoto", "remote control"],
  ["mando", "remote"],
  ["audífonos", "headphones"],
  ["audifonos", "headphones"],
  ["auriculares", "headphones"],
  ["cable", "cable"],
  ["cables", "cables"],
  ["adaptador", "adapter"],
  ["adaptadores", "adapters"],
  ["bombilla", "light bulb"],
  ["foco", "light bulb"],
  ["linterna", "flashlight"],
  ["destornillador", "screwdriver"],
  ["martillo", "hammer"],
  ["taladro", "drill"],
  ["llave", "wrench"],
  ["cinta", "tape"],
  ["cinta adhesiva", "tape"],
  ["pegamento", "glue"],
  ["baterías", "batteries"],
];

function locationPhrasePairs(): readonly (readonly [string, string])[] {
  const pairs: [string, string][] = [];
  const len = Math.min(DEFAULT_LOCATION_PRESETS.length, DEFAULT_LOCATION_PRESETS_ES.length);
  for (let i = 0; i < len; i += 1) {
    const en = DEFAULT_LOCATION_PRESETS[i]!.toLowerCase();
    const es = DEFAULT_LOCATION_PRESETS_ES[i]!.toLowerCase();
    if (en !== es) pairs.push([es, en], [en, es]);
  }
  return pairs;
}

const ALL_PHRASE_PAIRS: readonly (readonly [string, string])[] = [
  ...locationPhrasePairs(),
  ...HOUSEHOLD_PHRASES,
];

/** Longest phrases first so "botella de agua" wins over "agua". */
const PHRASES_BY_LENGTH = [...ALL_PHRASE_PAIRS].sort(
  (a, b) => Math.max(b[0].length, b[1].length) - Math.max(a[0].length, a[1].length)
);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacePhraseInsensitive(text: string, from: string, to: string): string {
  const re = new RegExp(escapeRegExp(from), "gi");
  return text.replace(re, to);
}

function normalizeForLookup(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Expand a search query with bilingual variants so Spanish queries can match
 * English inventory names (and vice versa).
 */
export function expandBilingualQuery(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);
  const lower = trimmed.toLowerCase();
  const normalized = normalizeForLookup(trimmed);

  for (const [left, right] of PHRASES_BY_LENGTH) {
    const leftNorm = normalizeForLookup(left);
    const rightNorm = normalizeForLookup(right);

    if (normalized.includes(leftNorm) || lower.includes(left)) {
      variants.add(right);
      variants.add(replacePhraseInsensitive(trimmed, left, right));
    }
    if (normalized.includes(rightNorm) || lower.includes(right)) {
      variants.add(left);
      variants.add(replacePhraseInsensitive(trimmed, right, left));
    }
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length > 0) {
    const tokenMap = new Map<string, string>();
    for (const [left, right] of ALL_PHRASE_PAIRS) {
      const leftNorm = normalizeForLookup(left);
      const rightNorm = normalizeForLookup(right);
      if (!left.includes(" ") && leftNorm !== rightNorm) {
        tokenMap.set(leftNorm, right);
        tokenMap.set(rightNorm, left);
      }
    }

    const swapped = tokens.map((token) => tokenMap.get(token) ?? token);
    if (swapped.join(" ") !== tokens.join(" ")) {
      variants.add(swapped.join(" "));
    }
  }

  return [...variants];
}
