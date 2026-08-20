import { describe, it, expect } from "vitest";
import {
  toriToolLabel,
  summarizeToriInput,
  summarizeToriOutput,
  applyToriTraceEvent,
} from "./toriTrace";

describe("toriTrace", () => {
  it("uses friendly tool labels", () => {
    expect(toriToolLabel("search_items")).toBe("Searching inventory");
    expect(toriToolLabel("get_expiring")).toBe("Checking what's expiring");
    expect(toriToolLabel("unknown_tool")).toBe("unknown tool");
  });

  it("summarizes tool inputs", () => {
    expect(summarizeToriInput("search_items", { query: "milk" })).toBe("milk");
    expect(summarizeToriInput("get_expiring", { within_days: 7 })).toBe("Next 7 days");
    expect(summarizeToriInput("get_expiring", { within_days: 0 })).toBe("Today and overdue");
    expect(summarizeToriInput("items_in_location", { location: "Fridge" })).toBe("Fridge");
    expect(summarizeToriInput("propose_add_item", { name: "Milk" })).toBe("Milk");
  });

  it("summarizes tool outputs without dumping raw JSON", () => {
    expect(summarizeToriOutput("search_items", { count: 0, items: [] })).toBe("No matching items");
    expect(summarizeToriOutput("search_items", { count: 1, items: [{ name: "Milk" }] })).toBe(
      "Found 1 item"
    );
    expect(
      summarizeToriOutput("get_expiring", {
        count: 2,
        items: [{ name: "Yogurt" }, { name: "Milk" }],
      })
    ).toBe("2 expiring items");
    expect(
      summarizeToriOutput("get_inventory_value", {
        itemCount: 3,
        pricedCount: 0,
        missingPriceCount: 3,
        totalValue: 0,
      })
    ).toBe("No recorded prices");
    expect(
      summarizeToriOutput("propose_add_item", {
        needsConfirmation: true,
        item: { name: "Milk" },
      })
    ).toBe("Waiting for you to confirm · Milk");
    expect(summarizeToriOutput("search_items", { error: "Forbidden" })).toBe("Forbidden");
  });

  it("updates trace steps as tools start and finish", () => {
    const started = applyToriTraceEvent([], {
      type: "tool.start",
      id: "call_1",
      name: "search_items",
      input: { query: "milk" },
    });
    expect(started[0]).toMatchObject({ status: "running", name: "search_items" });
    const finished = applyToriTraceEvent(started, {
      type: "tool.result",
      id: "call_1",
      output: { count: 1 },
    });
    expect(finished[0].status).toBe("done");
    expect(finished[0].output).toEqual({ count: 1 });
  });
});
