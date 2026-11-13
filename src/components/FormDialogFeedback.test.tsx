import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { FormDialogFeedback } from "@/components/FormDialogFeedback";
import { ApiError } from "@/lib/api/apiError";

it("explains when no reload callback is available", () => {
  render(
    <FormDialogFeedback
      error={new ApiError("conflict", "Conflict")}
      pending={false}
    />,
  );
  expect(screen.getByRole("button", { name: "Reload" })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("Reload is unavailable.");
});
it("runs the supplied reload action deliberately", async () => {
  const reload = vi.fn();
  render(
    <FormDialogFeedback
      error={new ApiError("conflict", "Conflict")}
      pending={false}
      onReload={reload}
    />,
  );
  await userEvent.click(screen.getByRole("button", { name: "Reload" }));
  expect(reload).toHaveBeenCalledOnce();
});
