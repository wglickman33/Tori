import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function storeItemImage(opts: {
  buffer: Buffer;
  mimeType: string;
  householdId: string;
  itemId: string;
}): Promise<string> {
  if (!ALLOWED_IMAGE_TYPES.has(opts.mimeType)) {
    throw Object.assign(new Error("Only JPEG, PNG, and WebP images are allowed"), { status: 400 });
  }
  if (opts.buffer.byteLength > MAX_IMAGE_BYTES) {
    throw Object.assign(new Error("Image must be 5MB or smaller"), { status: 400 });
  }

  if (cloudinaryConfigured()) {
    configureCloudinary();
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `tori/${opts.householdId}`,
          public_id: opts.itemId,
          overwrite: true,
          resource_type: "image",
        },
        (err, uploaded) => {
          if (err || !uploaded) reject(err ?? new Error("Cloudinary upload failed"));
          else resolve(uploaded as { secure_url: string });
        }
      );
      stream.end(opts.buffer);
    });
    return result.secure_url;
  }

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const ext = opts.mimeType === "image/png" ? "png" : opts.mimeType === "image/webp" ? "webp" : "jpg";
  const filename = `${opts.householdId}_${opts.itemId}.${ext}`;
  await fs.writeFile(path.join(UPLOADS_DIR, filename), opts.buffer);
  return `/uploads/${filename}`;
}

export async function deleteStoredImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;

  if (imageUrl.startsWith("/uploads/")) {
    const filename = path.basename(imageUrl);
    try {
      await fs.unlink(path.join(UPLOADS_DIR, filename));
    } catch {
      /* already gone */
    }
    return;
  }

  if (cloudinaryConfigured() && imageUrl.includes("res.cloudinary.com")) {
    configureCloudinary();
    const publicId = extractCloudinaryPublicId(imageUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch {
        /* ignore */
      }
    }
  }
}

function extractCloudinaryPublicId(url: string): string | null {
  const marker = "/upload/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  let rest = url.slice(idx + marker.length);
  rest = rest.replace(/^v\d+\//, "");
  rest = rest.replace(/\.[a-zA-Z0-9]+$/, "");
  return rest || null;
}
