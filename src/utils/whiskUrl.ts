const DEFAULT_WHISK_URL = "https://trywhisk.netlify.app";

export function getWhiskUrl(): string {
  const fromEnv = import.meta.env.VITE_WHISK_URL;
  if (typeof fromEnv === "string" && fromEnv.trim()) return fromEnv.trim();
  return DEFAULT_WHISK_URL;
}
