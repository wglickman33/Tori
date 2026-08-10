import { Router } from "express";
import { Folder, Item } from "../models/index.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { requireMembership } from "../utils/householdAccess.js";
import { buildInventoryCsv } from "../utils/csv.js";

export const exportRouter = Router({ mergeParams: true });

exportRouter.use(authMiddleware);

exportRouter.get("/", async (req: AuthedRequest, res) => {
  const householdId = req.params.householdId!;
  try {
    await requireMembership(householdId, req.userId!);
  } catch {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const [folders, items] = await Promise.all([
    Folder.findAll({ where: { householdId }, order: [["name", "ASC"]] }),
    Item.findAll({ where: { householdId }, order: [["name", "ASC"]] }),
  ]);

  const csv = buildInventoryCsv(folders, items);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="tori-inventory.csv"');
  res.status(200).send(csv);
});
