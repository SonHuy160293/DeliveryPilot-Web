import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmAction } from "@/components/ConfirmAction";

describe("workspace action confirmation", () => {
  it("does not collect a reason for actions that cannot send one", async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    render(
      <ConfirmAction
        label="Decline invitation"
        target="Cedar"
        consequence="The invitation will close."
        reasonMode="none"
        pending={false}
        error={undefined}
        onConfirm={confirm}
      />,
    );
    const user = userEvent.setup();
    await user.click(
      screen.getByRole("button", { name: "Decline invitation" }),
    );
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).queryByLabelText(/reason/i)).not.toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: "Decline invitation" }),
    );
    expect(confirm).toHaveBeenCalledWith(null);
  });
  it("requires a reason for access-reducing actions", async () => {
    const confirm = vi.fn().mockResolvedValue(true);
    render(
      <ConfirmAction
        label="Remove member"
        target="Alex"
        consequence="Membership will close."
        pending={false}
        error={undefined}
        onConfirm={confirm}
      />,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Remove member" }));
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Remove member" }),
    );
    expect(
      await within(dialog).findByText(/Enter a business reason/),
    ).toBeVisible();
    expect(confirm).not.toHaveBeenCalled();
  });
});
