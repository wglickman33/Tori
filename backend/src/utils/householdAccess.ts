import { HouseholdMember } from "../models/HouseholdMember.js";

export async function getMembership(householdId: string, userId: string) {
  return HouseholdMember.findOne({ where: { householdId, userId } });
}

export async function requireMembership(householdId: string, userId: string) {
  const membership = await getMembership(householdId, userId);
  if (!membership) {
    const err = new Error("Forbidden") as Error & { status?: number };
    err.status = 403;
    throw err;
  }
  return membership;
}
