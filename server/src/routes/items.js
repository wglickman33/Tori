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

// GET /api/users/:userId/items — all items (root + from all folders), same shape as firebaseService.fetchItems
router.get("/", (req, res, next) => {
  try {
    const items = store.getAllItems(req.userId);
    res.json(items);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/:userId/items — body: { name, location, purchaseDate, quantity, expirationDate, customTag, folderId? }
router.post("/", (req, res, next) => {
  try {
    const { folderId, ...itemData } = req.body;
    const item = store.createItem(req.userId, folderId || null, itemData);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:userId/items/:itemId — body can include folderId (new), currentFolderId (current location)
router.patch("/:itemId", (req, res, next) => {
  try {
    const { folderId, currentFolderId, ...updates } = req.body;
    const ok = store.updateItem(
      req.userId,
      req.params.itemId,
      folderId ?? null,
      currentFolderId ?? null,
      updates
    );
    if (!ok) return res.status(404).json({ message: "Item not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:userId/items/:itemId?folderId= — folderId in query for items inside a folder
router.delete("/:itemId", (req, res, next) => {
  try {
    const folderId = req.query.folderId || req.body?.folderId || null;
    const ok = store.deleteItem(req.userId, req.params.itemId, folderId || null);
    if (!ok) return res.status(404).json({ message: "Item not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
