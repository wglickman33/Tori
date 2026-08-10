import type { Response } from "express";

export type HouseholdStreamEvent =
  | { type: "folder.created"; householdId: string; actorUserId: string; folder: Record<string, unknown> }
  | { type: "folder.updated"; householdId: string; actorUserId: string; folder: Record<string, unknown> }
  | { type: "folder.deleted"; householdId: string; actorUserId: string; folderId: string }
  | { type: "item.created"; householdId: string; actorUserId: string; item: Record<string, unknown> }
  | { type: "item.updated"; householdId: string; actorUserId: string; item: Record<string, unknown> }
  | { type: "item.deleted"; householdId: string; actorUserId: string; itemId: string }
  | { type: "membership.revoked"; householdId: string; actorUserId: string };

interface StreamClient {
  res: Response;
  userId: string;
}

const householdClients = new Map<string, Set<StreamClient>>();

function writeEvent(res: Response, event: HouseholdStreamEvent): void {
  res.write(`event: ${event.type}\n`);
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

export function subscribeHouseholdEvents(householdId: string, userId: string, res: Response): () => void {
  let clients = householdClients.get(householdId);
  if (!clients) {
    clients = new Set();
    householdClients.set(householdId, clients);
  }
  const client = { res, userId };
  clients.add(client);

  return () => {
    clients?.delete(client);
    if (clients && clients.size === 0) householdClients.delete(householdId);
  };
}

export function publishHouseholdEvent(event: HouseholdStreamEvent): void {
  const clients = householdClients.get(event.householdId);
  if (!clients) return;
  for (const client of clients) {
    writeEvent(client.res, event);
  }
}

export function closeUserHouseholdStreams(householdId: string, userId: string): void {
  const clients = householdClients.get(householdId);
  if (!clients) return;
  for (const client of [...clients]) {
    if (client.userId !== userId) continue;
    writeEvent(client.res, {
      type: "membership.revoked",
      householdId,
      actorUserId: userId,
    });
    client.res.end();
    clients.delete(client);
  }
  if (clients.size === 0) householdClients.delete(householdId);
}
