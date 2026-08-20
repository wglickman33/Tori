import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    displayName: z.string().trim().min(1, "Display name is required").max(80),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().email(),
    password: z.string().min(1, "Password is required"),
  })
  .strict();

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().email(),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
  })
  .strict();

export const createHouseholdSchema = z
  .object({
    name: z.string().trim().min(1, "Household name is required").max(80),
  })
  .strict();

export const joinHouseholdSchema = z
  .object({
    inviteCode: z.string().trim().min(4).max(16),
  })
  .strict();

export const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1, "Display name is required").max(80).optional(),
    email: z.string().trim().email().optional(),
    currentPassword: z.string().min(1).optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
    theme: z.enum(["light", "dark", "auto"]).optional(),
    language: z.enum(["en", "es"]).optional(),
  })
  .strict()
  .refine((v) => Object.keys(v).length > 0, { message: "No updates provided" })
  .refine((v) => !v.newPassword || !!v.currentPassword, {
    message: "Current password is required to set a new password",
    path: ["currentPassword"],
  });

export const updateHouseholdSchema = z
  .object({
    name: z.string().trim().min(1, "Household name is required").max(80),
  })
  .strict();

export const updateLocationPresetsSchema = z
  .object({
    locationPresets: z
      .array(z.string().trim().min(1, "Location name is required").max(80))
      .max(80),
  })
  .strict();

const optionalDate = z
  .union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal(""), z.null()])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

export const folderSchema = z
  .object({
    name: z.string().trim().min(1, "Folder name is required").max(120),
    category: z.string().trim().min(1, "Category is required").max(80),
    creationDate: optionalDate,
  })
  .strict();

export const folderUpdateSchema = folderSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: "No updates provided",
});

export const itemSchema = z
  .object({
    name: z.string().trim().min(1, "Item name is required").max(120),
    location: z
      .union([z.string().trim().max(80), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    folderId: z
      .union([z.string().uuid(), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === undefined ? null : v)),
    purchaseDate: optionalDate,
    expirationDate: optionalDate,
    quantity: z.coerce.number().int().min(1).max(100000).default(1),
    price: z
      .union([z.coerce.number().min(0).max(1_000_000_000), z.literal(""), z.null()])
      .optional()
      .transform((v) => (v === "" || v === undefined || v === null ? null : Number(v).toFixed(2))),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  })
  .strict();

export const itemUpdateSchema = itemSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: "No updates provided",
});

export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request";
}

export const TORI_CHAT_LIMITS = {
  messageMax: 4000,
  maxMessages: 40,
};

const TORI_CHAT_ROLES = new Set(["user", "assistant"]);

export type ToriChatMessage = { role: "user" | "assistant"; content: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function validateToriChatBody(
  body: Record<string, unknown>
): { error: string } | { householdId: string; messages: ToriChatMessage[]; locale: "en" | "es" } {
  if (typeof body.householdId !== "string" || !isValidUuid(body.householdId.trim())) {
    return { error: "A household is required." };
  }
  const householdId = body.householdId.trim();
  if (!Array.isArray(body.messages)) {
    return { error: "Messages must be an array." };
  }
  if (body.messages.length === 0) {
    return { error: "At least one message is required." };
  }
  if (body.messages.length > TORI_CHAT_LIMITS.maxMessages) {
    return { error: `Too many messages (max ${TORI_CHAT_LIMITS.maxMessages}).` };
  }

  const messages: ToriChatMessage[] = [];
  for (const item of body.messages) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      return { error: "Each message must be an object." };
    }
    const raw = item as Record<string, unknown>;
    if (typeof raw.role !== "string" || !TORI_CHAT_ROLES.has(raw.role)) {
      return { error: "Each message role must be user or assistant." };
    }
    if (typeof raw.content !== "string") {
      return { error: "Each message must include text." };
    }
    const content = raw.content.trim();
    if (!content) {
      return { error: "Message text cannot be empty." };
    }
    if (content.length > TORI_CHAT_LIMITS.messageMax) {
      return { error: `Message text must be at most ${TORI_CHAT_LIMITS.messageMax} characters.` };
    }
    messages.push({ role: raw.role as "user" | "assistant", content });
  }

  if (messages[messages.length - 1].role !== "user") {
    return { error: "The last message must come from the user." };
  }

  return { householdId, messages, locale: body.locale === "es" ? "es" : "en" };
}
