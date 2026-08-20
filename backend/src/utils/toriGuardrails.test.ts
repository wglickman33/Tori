import { describe, it, expect } from "vitest";
import { isToriOffTopic } from "./toriGuardrails.js";

describe("isToriOffTopic", () => {
  it("flags general knowledge that is outside the household", () => {
    expect(isToriOffTopic("Who was the last president?")).toBe(true);
    expect(isToriOffTopic("How do I file my taxes?")).toBe(true);
    expect(isToriOffTopic("What is the current US president?")).toBe(true);
    expect(isToriOffTopic("Write me a python script")).toBe(true);
  });

  it("allows inventory, expiry, locations, and storage questions", () => {
    expect(isToriOffTopic("What's expiring this week?")).toBe(false);
    expect(isToriOffTopic("Where is the extra paper towels?")).toBe(false);
    expect(isToriOffTopic("How should I store milk?")).toBe(false);
    expect(isToriOffTopic("What's in the fridge?")).toBe(false);
  });
});
