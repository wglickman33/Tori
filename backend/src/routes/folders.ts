import { Router } from "express";
import { Folder, Item } from "../models/index.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { requireMembership } from "../utils/householdAccess.js";
import { folderSchema, folderUpdateSchema, formatZodError } from "../utils/validation.js";
import { serializeFolder } from "../utils/serialize.js";
import { publishHouseholdEvent } from "../utils/householdEvents.js";

export const foldersRouter = Router({ mergeParams: true });

foldersRouter.use(authMiddleware);

foldersRouter.get("/", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const folders = await Folder.findAll({
    where: { householdId },
    order: [["name", "ASC"]],
  });
  res.json({ folders: folders.map(serializeFolder) });
});

foldersRouter.post("/", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = folderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const folder = await Folder.create({
    householdId,
    name: parsed.data.name,
    category: parsed.data.category,
    creationDate: parsed.data.creationDate,
  });
  const payload = serializeFolder(folder);
  publishHouseholdEvent({
    type: "folder.created",
    householdId,
    actorUserId: req.userId!,
    folder: payload,
  });
  res.status(201).json({ folder: payload });
});

foldersRouter.patch("/:folderId", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const parsed = folderUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const folder = await Folder.findOne({ where: { id: req.params.folderId, householdId } });
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  await folder.update(parsed.data);
  const payload = serializeFolder(folder);
  publishHouseholdEvent({
    type: "folder.updated",
    householdId,
    actorUserId: req.userId!,
    folder: payload,
  });
  res.json({ folder: payload });
});

foldersRouter.delete("/:folderId", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const folder = await Folder.findOne({ where: { id: req.params.folderId, householdId } });
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  await Item.destroy({ where: { householdId, folderId: folder.id } });
  await folder.destroy();
  publishHouseholdEvent({
    type: "folder.deleted",
    householdId,
    actorUserId: req.userId!,
    folderId: folder.id,
  });
  res.status(204).send();
});
