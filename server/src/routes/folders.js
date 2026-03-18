import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as store from "../store.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);
router.use((req, res, next) => {
  const userId = req.params.userId;
  if (userId !== req.authUser?.uid) {
    return res.status(403).json({ message: "Forbidden" });
  }
  req.userId = userId;
  next();
});

// GET /api/users/:userId/folders — list folders (as array for client parity)
router.get("/", (req, res, next) => {
  try {
    const raw = store.getFolders(req.userId);
    if (!raw) return res.json([]);
    const folders = Object.keys(raw).map((key) => ({
      id: key,
      ...raw[key],
      items: undefined,
    }));
    res.json(folders);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:userId/folders
router.post("/", (req, res, next) => {
  try {
    const folder = store.createFolder(req.userId, req.body);
    res.status(201).json(folder);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:userId/folders/:folderId
router.patch("/:folderId", (req, res, next) => {
  try {
    const ok = store.updateFolder(req.userId, req.params.folderId, req.body);
    if (!ok) return res.status(404).json({ message: "Folder not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:userId/folders/:folderId
router.delete("/:folderId", (req, res, next) => {
  try {
    const ok = store.deleteFolder(req.userId, req.params.folderId);
    if (!ok) return res.status(404).json({ message: "Folder not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
