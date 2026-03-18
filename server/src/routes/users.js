import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import * as store from "../store.js";

const router = Router();

// All user profile routes require auth and userId must match req.authUser.uid
router.use("/:userId", requireAuth, (req, res, next) => {
  if (req.params.userId !== req.authUser.uid) {
    return res.status(403).json({ message: "Forbidden" });
  }
  req.userId = req.params.userId;
  next();
});

// POST /api/users/:userId — create/ensure user profile (e.g. after register)
router.post("/:userId", (req, res, next) => {
  try {
    const userId = req.userId;
    const body = req.body || {};
    const { created_at, updated_at, ...rest } = body;
    const data = {
      ...rest,
      created_at: rest.created_at || new Date().toISOString(),
      updated_at: rest.updated_at || new Date().toISOString(),
    };
    store.setUser(userId, data);
    const user = store.getUser(userId);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:userId
router.get("/:userId", (req, res, next) => {
  try {
    const user = store.getUser(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:userId
router.patch("/:userId", (req, res, next) => {
  try {
    store.updateUser(req.userId, req.body);
    const user = store.getUser(req.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:userId
router.delete("/:userId", (req, res, next) => {
  try {
    store.deleteUser(req.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
