import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfirmDeleteModal } from "../inventory/ConfirmDeleteModal";

describe("ConfirmDeleteModal (leave/dissolve confirm gate)", () => {
  afterEach(() => {
    cleanup();
  });

  it("does not confirm until Leave is pressed", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen
        title="Leave household"
        confirmLabel="Leave"
        message="If you are the only member, this permanently deletes the household and all inventory."
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByRole("dialog", { name: "Leave household" })).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("runs onConfirm when Leave is pressed", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <ConfirmDeleteModal
        isOpen
        title="Leave household"
        confirmLabel="Leave"
        message="You will leave this household and lose access until invited again."
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Leave" }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
