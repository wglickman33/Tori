import { Router } from "express";
import { Folder, Item } from "../models/index.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { requireMembership } from "../utils/householdAccess.js";
import { formatZodError, itemSchema, itemUpdateSchema } from "../utils/validation.js";
import { serializeItem } from "../utils/serialize.js";
import { publishHouseholdEvent } from "../utils/householdEvents.js";

export const itemsRouter = Router({ mergeParams: true });

itemsRouter.use(authMiddleware);

async function assertFolderInHousehold(householdId: string, folderId: string | null) {
  if (!folderId) return;
  const folder = await Folder.findOne({ where: { id: folderId, householdId } });
  if (!folder) {
    const err = new Error("Folder not found in this household") as Error & { status?: number };
    err.status = 400;
    throw err;
  }
}

itemsRouter.get("/", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const items = await Item.findAll({
    where: { householdId },
    order: [["name", "ASC"]],
  });
  res.json({ items: items.map(serializeItem) });
});

itemsRouter.post("/", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = itemSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  try {
    await assertFolderInHousehold(householdId, parsed.data.folderId ?? null);
  } catch (err) {
    res.status((err as { status?: number }).status ?? 400).json({
      error: err instanceof Error ? err.message : "Invalid folder",
    });
    return;
  }

  const item = await Item.create({
    householdId,
    folderId: parsed.data.folderId ?? null,
    name: parsed.data.name,
    location: parsed.data.location ?? null,
    purchaseDate: parsed.data.purchaseDate,
    expirationDate: parsed.data.expirationDate,
    quantity: parsed.data.quantity,
    price: parsed.data.price,
    tags: parsed.data.tags,
  });

  const payload = serializeItem(item);
  publishHouseholdEvent({
    type: "item.created",
    householdId,
    actorUserId: req.userId!,
    item: payload,
  });
  res.status(201).json({ item: payload });
});

itemsRouter.patch("/:itemId", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = itemUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const item = await Item.findOne({ where: { id: req.params.itemId, householdId } });
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  if ("folderId" in parsed.data) {
    try {
      await assertFolderInHousehold(householdId, parsed.data.folderId ?? null);
    } catch (err) {
      res.status((err as { status?: number }).status ?? 400).json({
        error: err instanceof Error ? err.message : "Invalid folder",
      });
      return;
    }
  }

  await item.update(parsed.data);
  const payload = serializeItem(item);
  publishHouseholdEvent({
    type: "item.updated",
    householdId,
    actorUserId: req.userId!,
    item: payload,
  });
  res.json({ item: payload });
});

itemsRouter.delete("/:itemId", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const item = await Item.findOne({ where: { id: req.params.itemId, householdId } });
  if (!item) {
    res.status(404).json({ error: "Item not found" });
    return;
  }

  const itemId = item.id;
  await item.destroy();
  publishHouseholdEvent({
    type: "item.deleted",
    householdId,
    actorUserId: req.userId!,
    itemId,
  });
  res.status(204).send();
});
