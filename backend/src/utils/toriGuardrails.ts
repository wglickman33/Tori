export type ToriLocale = "en" | "es";

export const TORI_OFF_TOPIC_REPLY =
  "I can help with household inventory, storage, expiry, locations, and tags. I don't cover things like politics, news, or taxes. What do you have at home?";

export const TORI_OFF_TOPIC_REPLY_ES =
  "Puedo ayudar con el inventario del hogar, el almacenamiento, el vencimiento, las ubicaciones y las etiquetas. No cubro temas como política, noticias o impuestos. ¿Qué tienes en casa?";

export function parseToriLocale(value: unknown): ToriLocale {
  return value === "es" ? "es" : "en";
}

export function toriOffTopicReply(locale: ToriLocale = "en"): string {
  return locale === "es" ? TORI_OFF_TOPIC_REPLY_ES : TORI_OFF_TOPIC_REPLY;
}

const OFF_TOPIC_PATTERNS: RegExp[] = [
  /\b(who|which).{0,40}\b(president|prime minister|senator|congress(?:wo)?man|governor)\b/i,
  /\b(last|current|former|next)\s+(us |u\.s\. |american )?(president|prime minister)\b/i,
  /\b(president|prime minister) of the (united states|usa|u\.s\.a?|america)\b/i,
  /\b(election|electoral college|white house|capitol hill|supreme court)\b/i,
  /\b(democrat|republican|political party|congress)\b/i,
  /\b(file|pay|owe|income|property|sales)\b.{0,24}\btaxes?\b/i,
  /\b(irs|tax (?:return|bracket|refund)|capital gains|401k|roth ira)\b/i,
  /\b(stock market|nasdaq|s&p|bitcoin|cryptocurrenc)/i,
  /\b(write|debug|fix).{0,24}\b(python|javascript|typescript|java|code|sql)\b/i,
  /\b(who won).{0,32}\b(game|match|super bowl|world cup|election)\b/i,
  /\b(qui[eé]n|cu[aá]l).{0,40}\b(presidente|primera ministra|senador(?:a)?|gobernador(?:a)?)\b/i,
  /\b([uú]ltimo|actual|ex|pr[oó]ximo)\s+presidente\b/i,
  /\bpresidente de (los )?estados unidos\b/i,
  /\b(elecciones|colegio electoral|casa blanca|corte suprema)\b/i,
  /\b(impuestos?|declaraci[oó]n de impuestos|hacienda)\b/i,
  /\b(mercado de valores|criptomonedas?)\b/i,
  /\bescr[ií]b\w*.{0,32}\b(python|javascript|typescript|java|c[oó]digo|sql|script)\b/i,
  /\b(qui[eé]n gan[oó]).{0,32}\b(partido|juego|mundial|super bowl|elecciones)\b/i,
];

const HOUSEHOLD_OVERRIDE =
  /\b(inventory|item|items|fridge|freezer|pantry|expire|expiring|expiry|location|locations|tag|tags|folder|folders|household|storage|store|quantity|price|prices|inventario|art[ií]culos?|refrigerador|nevera|congelador|despensa|vence|vencen|vencimiento|caduca|ubicaci[oó]n(?:es)?|etiquetas?|carpetas?|hogar|almacenamiento|guardar|cantidad|precios?)\b/i;

export function isToriOffTopic(text: string): boolean {
  const content = text.trim();
  if (!content) return false;
  if (HOUSEHOLD_OVERRIDE.test(content)) return false;
  return OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(content));
}
