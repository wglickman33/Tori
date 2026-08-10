import { Router } from "express";
import multer from "multer";
import { Item } from "../models/index.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { requireMembership } from "../utils/householdAccess.js";
import { serializeItem } from "../utils/serialize.js";
import { publishHouseholdEvent } from "../utils/householdEvents.js";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  deleteStoredImage,
  storeItemImage,
} from "../utils/imageStorage.js";

export const itemImagesRouter = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

itemImagesRouter.use(authMiddleware);

itemImagesRouter.post("/", (req: AuthedRequest, res) => {
  upload.single("image")(req, res, async (err) => {
    if (err) {
      const message =
        err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE"
          ? "Image must be 5MB or smaller"
          : err.message || "Upload failed";
      res.status(400).json({ error: message });
      return;
    }

    const householdId = req.params.householdId!;
    const itemId = req.params.itemId!;

    try {
      await requireMembership(householdId, req.userId!);
    } catch {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "Image file is required" });
      return;
    }

    const item = await Item.findOne({ where: { id: itemId, householdId } });
    if (!item) {
      res.status(404).json({ error: "Item not found" });
      return;
    }

    try {
      const previous = item.imageUrl;
      const imageUrl = await storeItemImage({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        householdId,
        itemId,
      });
      await item.update({ imageUrl });
      if (previous && previous !== imageUrl) await deleteStoredImage(previous);

      const payload = serializeItem(item);
      publishHouseholdEvent({
        type: "item.updated",
        householdId,
        actorUserId: req.userId!,
        item: payload,
      });
      res.json({ item: payload });
    } catch (error) {
      const status = (error as { status?: number }).status ?? 500;
      res.status(status).json({
        error: error instanceof Error ? error.message : "Upload failed",
      });
    }
  });
});

itemImagesRouter.delete("/", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  const itemId = req.params.itemId!;

  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const item = await Item.findOne({ where: { id: itemId, householdId } });
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  await deleteStoredImage(item.imageUrl);
  await item.update({ imageUrl: null });
  const payload = serializeItem(item);
  publishHouseholdEvent({
    type: "item.updated",
    householdId,
    actorUserId: req.userId!,
    item: payload,
  });
  res.json({ item: payload });
});
