import { describe, expect, it, vi } from "vitest";
import type { Response } from "express";
import { publishHouseholdEvent, subscribeHouseholdEvents } from "./householdEvents.js";

function mockRes() {
  const chunks: string[] = [];
  return {
    chunks,
    res: {
      write: vi.fn((chunk: string) => {
        chunks.push(chunk);
        return true;
      }),
      end: vi.fn(),
    } as unknown as Response,
  };
}

describe("householdEvents", () => {
  it("publishes named events to subscribed household clients", () => {
    const { res, chunks } = mockRes();
    const unsub = subscribeHouseholdEvents("h1", "u1", res);
    publishHouseholdEvent({
      type: "folder.created",
      householdId: "h1",
      actorUserId: "u2",
      folder: { id: "f1", name: "Pantry" },
    });
    expect(chunks.join("")).toContain("event: folder.created");
    expect(chunks.join("")).toContain("Pantry");
    unsub();
  });

  it("does not publish to other households", () => {
    const { res, chunks } = mockRes();
    const unsub = subscribeHouseholdEvents("h1", "u1", res);
    publishHouseholdEvent({
      type: "item.deleted",
      householdId: "h2",
      actorUserId: "u2",
      itemId: "i1",
    });
    expect(chunks.join("")).toBe("");
    unsub();
  });
});
