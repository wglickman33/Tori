import { Router } from "express";
import { Op } from "sequelize";
import { Household, HouseholdMember, User } from "../models/index.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import {
  createHouseholdSchema,
  formatZodError,
  joinHouseholdSchema,
  updateHouseholdSchema,
  updateLocationPresetsSchema,
} from "../utils/validation.js";
import { DEFAULT_LOCATION_PRESETS, defaultLocationPresetsForLanguage, normalizeLocationPresets } from "../constants/locations.js";
import { generateInviteCode, normalizeInviteCode } from "../utils/inviteCode.js";
import { closeUserHouseholdStreams, publishHouseholdEvent } from "../utils/householdEvents.js";
import { destroyHouseholdData } from "../utils/householdCleanup.js";

export const householdsRouter = Router();

householdsRouter.use(authMiddleware);

async function serializeHouseholdForUser(userId: string, householdId: string) {
  const membership = await HouseholdMember.findOne({ where: { householdId, userId } });
  if (!membership) return null;

  const household = await Household.findByPk(householdId);
  if (!household) return null;

  const memberCount = await HouseholdMember.count({ where: { householdId: household.id } });

  // Backfill legacy rows that predate locationPresets.
  let locationPresets = normalizeLocationPresets(household.locationPresets);
  if (!Array.isArray(household.locationPresets) || household.locationPresets.length === 0) {
    locationPresets = [...DEFAULT_LOCATION_PRESETS];
    household.locationPresets = locationPresets;
    await household.save();
  }

  return {
    id: household.id,
    name: household.name,
    inviteCode: membership.role === "owner" ? household.inviteCode : null,
    role: membership.role,
    ownerId: household.ownerId,
    memberCount,
    locationPresets,
  };
}

async function listHouseholdsForUser(userId: string) {
  const memberships = await HouseholdMember.findAll({
    where: { userId },
    order: [["joinedAt", "ASC"]],
  });
  const households = [];
  for (const membership of memberships) {
    const row = await serializeHouseholdForUser(userId, membership.householdId);
    if (row) households.push(row);
  }
  return households;
}

householdsRouter.get("/mine", async (req: AuthedRequest, res) => {
  const households = await listHouseholdsForUser(req.userId!);
  res.json({
    households,
    household: households[0] ?? null,
  });
});

householdsRouter.post("/", async (req: AuthedRequest, res) => {
  const parsed = createHouseholdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i += 1) {
    const clash = await Household.findOne({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const owner = await User.findByPk(req.userId!);
  const household = await Household.create({
    name: parsed.data.name,
    inviteCode,
    ownerId: req.userId!,
    locationPresets: defaultLocationPresetsForLanguage(owner?.language),
  });

  await HouseholdMember.create({
    householdId: household.id,
    userId: req.userId!,
    role: "owner",
  });

  const data = await serializeHouseholdForUser(req.userId!, household.id);
  res.status(201).json({ household: data });
});

householdsRouter.post("/join", async (req: AuthedRequest, res) => {
  const parsed = joinHouseholdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const inviteCode = normalizeInviteCode(parsed.data.inviteCode);
  const household = await Household.findOne({ where: { inviteCode } });
  if (!household) {
    res.status(404).json({ error: "Invalid invite code" });
    return;
  }

  const existing = await HouseholdMember.findOne({
    where: { householdId: household.id, userId: req.userId },
  });
  if (existing) {
    res.status(400).json({ error: "You already belong to this household" });
    return;
  }

  await HouseholdMember.create({
    householdId: household.id,
    userId: req.userId!,
    role: "member",
  });

  const data = await serializeHouseholdForUser(req.userId!, household.id);
  res.status(201).json({ household: data });
});

householdsRouter.get("/:id", async (req: AuthedRequest, res) => {
  const data = await serializeHouseholdForUser(req.userId!, req.params.id!);
  if (!data) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json({ household: data });
});

householdsRouter.patch("/:id", async (req: AuthedRequest, res) => {
  const parsed = updateHouseholdSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const membership = await HouseholdMember.findOne({
    where: { householdId: req.params.id, userId: req.userId },
  });
  if (!membership || membership.role !== "owner") {
    res.status(403).json({ error: "Only the owner can rename the household" });
    return;
  }

  const household = await Household.findByPk(req.params.id);
  if (!household) {
    res.status(404).json({ error: "Household not found" });
    return;
  }

  household.name = parsed.data.name;
  await household.save();
  const data = await serializeHouseholdForUser(req.userId!, household.id);
  res.json({ household: data });
});

householdsRouter.put("/:id/location-presets", async (req: AuthedRequest, res) => {
  const parsed = updateLocationPresetsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: formatZodError(parsed.error) });
    return;
  }

  const membership = await HouseholdMember.findOne({
    where: { householdId: req.params.id, userId: req.userId },
  });
  if (!membership) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const household = await Household.findByPk(req.params.id);
  if (!household) {
    res.status(404).json({ error: "Household not found" });
    return;
  }

  const locationPresets = normalizeLocationPresets(parsed.data.locationPresets);
  household.locationPresets = locationPresets;
  await household.save();

  publishHouseholdEvent({
    type: "household.updated",
    householdId: household.id,
    actorUserId: req.userId!,
    locationPresets,
  });

  const data = await serializeHouseholdForUser(req.userId!, household.id);
  res.json({ household: data });
});

householdsRouter.get("/:id/members", async (req: AuthedRequest, res) => {
  const membership = await HouseholdMember.findOne({
    where: { householdId: req.params.id, userId: req.userId },
  });
  if (!membership) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const rows = await HouseholdMember.findAll({
    where: { householdId: req.params.id },
    order: [["joinedAt", "ASC"]],
  });
  const userIds = rows.map((r) => r.userId);
  const users =
    userIds.length === 0
      ? []
      : await User.findAll({ where: { id: { [Op.in]: userIds } } });
  const byId = new Map(users.map((u) => [u.id, u]));

  res.json({
    members: rows.map((row) => {
      const user = byId.get(row.userId);
      return {
        userId: row.userId,
        displayName: user?.displayName ?? "Unknown",
        email: user?.email ?? "",
        role: row.role,
        joinedAt: row.joinedAt,
      };
    }),
  });
});

householdsRouter.delete("/:id/members/:userId", async (req: AuthedRequest, res) => {
  const householdId = req.params.id!;
  const targetUserId = req.params.userId!;

  const actor = await HouseholdMember.findOne({
    where: { householdId, userId: req.userId },
  });
  if (!actor || actor.role !== "owner") {
    res.status(403).json({ error: "Only the owner can remove members" });
    return;
  }
  if (targetUserId === req.userId) {
    res.status(400).json({ error: "Owners cannot remove themselves; delete the account or transfer ownership" });
    return;
  }

  const target = await HouseholdMember.findOne({ where: { householdId, userId: targetUserId } });
  if (!target) {
    res.status(404).json({ error: "Member not found" });
    return;
  }

  await target.destroy();
  closeUserHouseholdStreams(householdId, targetUserId);
  publishHouseholdEvent({
    type: "membership.revoked",
    householdId,
    actorUserId: req.userId!,
  });
  res.status(204).send();
});

householdsRouter.post("/:id/leave", async (req: AuthedRequest, res) => {
  const householdId = req.params.id!;
  const membership = await HouseholdMember.findOne({
    where: { householdId, userId: req.userId },
  });
  if (!membership) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (membership.role === "owner") {
    const count = await HouseholdMember.count({ where: { householdId } });
    if (count > 1) {
      res.status(400).json({
        error: "Owners with other members cannot leave; remove members first or delete your account after clearing the household",
      });
      return;
    }
    await destroyHouseholdData(householdId);
    res.status(204).send();
    return;
  }

  await membership.destroy();
  closeUserHouseholdStreams(householdId, req.userId!);
  res.status(204).send();
});

householdsRouter.post("/:id/regenerate-code", async (req: AuthedRequest, res) => {
  const membership = await HouseholdMember.findOne({
    where: { householdId: req.params.id, userId: req.userId },
  });
  if (!membership) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  if (membership.role !== "owner") {
    res.status(403).json({ error: "Only the owner can regenerate the invite code" });
    return;
  }

  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i += 1) {
    const clash = await Household.findOne({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const household = await Household.findByPk(req.params.id);
  if (!household) {
    res.status(404).json({ error: "Household not found" });
    return;
  }

  household.inviteCode = inviteCode;
  await household.save();

  res.json({ inviteCode });
});
