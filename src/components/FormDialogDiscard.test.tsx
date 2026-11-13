import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FormDialogDiscard } from "@/components/FormDialogDiscard";

it("names the discard decision and offers an explicit keep action", async () => {
  const keep = vi.fn();
  const discard = vi.fn();
  render(
    <Dialog open>
      <DialogContent>
        <FormDialogDiscard onKeep={keep} onDiscard={discard} />
      </DialogContent>
    </Dialog>,
  );
  expect(
    screen.getByRole("dialog", { name: "Discard changes?" }),
  ).toBeVisible();
  await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(keep).toHaveBeenCalledOnce();
  expect(discard).not.toHaveBeenCalled();
});
