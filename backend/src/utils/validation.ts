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
