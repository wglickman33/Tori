import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InviteCodePanel } from "./InviteCodePanel";

describe("InviteCodePanel", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("copies invite code and shows Copied feedback", async () => {
    const onRegenerate = vi.fn().mockResolvedValue(undefined);
    render(<InviteCodePanel embedded inviteCode="G5W53ZB7" onRegenerate={onRegenerate} />);

    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("G5W53ZB7");
      expect(screen.getByRole("button", { name: "Copied" })).toBeTruthy();
    });
  });

  it("calls onRegenerate when Regenerate is clicked", async () => {
    const onRegenerate = vi.fn().mockResolvedValue(undefined);
    render(<InviteCodePanel embedded inviteCode="G5W53ZB7" onRegenerate={onRegenerate} />);

    fireEvent.click(screen.getByRole("button", { name: "Regenerate" }));

    await waitFor(() => {
      expect(onRegenerate).toHaveBeenCalledTimes(1);
    });
  });
});
