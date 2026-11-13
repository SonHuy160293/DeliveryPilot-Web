import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";

const schema = z.object({ name: z.string().min(1, "Enter a name.") });
type Values = z.infer<typeof schema>;
function Harness({
  submit,
  reload,
}: {
  submit: (values: Values) => Promise<"done" | "keep-open">;
  reload?: () => Promise<Values>;
}) {
  return (
    <FormDialog
      title="Create record"
      description="Enter the record name."
      trigger={<Button variant="outline">Create record</Button>}
      schema={schema}
      defaultValues={{ name: "" }}
      submitLabel="Create"
      onSubmit={submit}
      onReload={reload}
    >
      {(form) => (
        <FormField
          id="name"
          label="Name"
          error={form.formState.errors.name?.message}
          {...form.register("name")}
        />
      )}
    </FormDialog>
  );
}
async function open() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Create record" }));
  return user;
}
async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Recorded name");
  await user.click(screen.getByRole("button", { name: "Create" }));
}
describe("form dialogs", () => {
  it("supports parsed output types from a transforming schema", async () => {
    const submit = vi
      .fn<(values: { amount: number }) => Promise<"done">>()
      .mockResolvedValue("done");
    render(
      <FormDialog
        title="Record amount"
        trigger={<Button>Record amount</Button>}
        submitLabel="Save"
        schema={z.object({ amount: z.string().transform(Number) })}
        defaultValues={{ amount: "" }}
        onSubmit={submit}
      >
        {(form) => (
          <FormField id="amount" label="Amount" {...form.register("amount")} />
        )}
      </FormDialog>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Record amount" }));
    await user.type(screen.getByLabelText("Amount"), "42");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(submit).toHaveBeenCalledWith({ amount: 42 });
  });
  it("renders repository denial without claiming a successful write", async () => {
    const submit = vi
      .fn<(values: Values) => Promise<"done">>()
      .mockRejectedValue(
        new ApiError("forbidden", "Not permitted", { status: 403 }),
      );
    render(<Harness submit={submit} />);
    await fillAndSubmit(await open());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Access to this operation is unavailable.",
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });
  it("validates on blur and associates the error with the field", async () => {
    const submit = vi
      .fn<(values: Values) => Promise<"done">>()
      .mockResolvedValue("done");
    render(<Harness submit={submit} />);
    const user = await open();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await user.click(screen.getByLabelText("Name"));
    await user.tab();
    expect(await screen.findByText("Enter a name.")).toBeVisible();
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription(
      "Enter a name.",
    );
    expect(submit).not.toHaveBeenCalled();
  });
  it("focuses the invalid field after attempted submission", async () => {
    render(<Harness submit={() => Promise.resolve("done")} />);
    const user = await open();
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveFocus();
    });
  });
  it("maps server field errors without displaying private text", async () => {
    const submit = vi
      .fn<(values: Values) => Promise<"done">>()
      .mockRejectedValue(
        new ApiError("validation", "Check fields.", {
          status: 422,
          fieldErrors: { Name: ["private detail"] },
        }),
      );
    render(<Harness submit={submit} />);
    await fillAndSubmit(await open());
    expect(
      await screen.findByText(
        "The server rejected this value. Review it before submitting again.",
      ),
    ).toBeVisible();
    expect(screen.queryByText("private detail")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
  });
  it("shows a recoverable server failure without claiming success", async () => {
    const submit = vi
      .fn<(values: Values) => Promise<"done">>()
      .mockRejectedValue(new ApiError("server", "Private server detail"));
    render(<Harness submit={submit} />);
    await fillAndSubmit(await open());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The outcome is unknown.",
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });
  it("offers Reload on conflict and resets to the fresh values", async () => {
    const submit = vi
      .fn<(values: Values) => Promise<"done">>()
      .mockRejectedValue(new ApiError("conflict", "Conflict", { status: 409 }));
    const reload = vi
      .fn<() => Promise<Values>>()
      .mockResolvedValue({ name: "Latest name" });
    render(<Harness submit={submit} reload={reload} />);
    const user = await open();
    await fillAndSubmit(user);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Someone else changed this. Reload to see the latest version.",
    );
    await user.click(screen.getByRole("button", { name: "Reload" }));
    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveValue("Latest name");
    });
    expect(reload).toHaveBeenCalledOnce();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("requires dirty-close confirmation and preserves a draft when kept", async () => {
    render(<Harness submit={() => Promise.resolve("done")} />);
    const user = await open();
    await user.type(screen.getByLabelText("Name"), "Draft");
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.getByRole("dialog", { name: "Discard changes?" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByLabelText("Name")).toHaveValue("Draft");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Create record" })).toHaveFocus();
  });
  it("makes fields read-only while submitting and allows confirmed departure", async () => {
    let finish: ((value: "done") => void) | undefined;
    const result = new Promise<"done">((resolve) => {
      finish = resolve;
    });
    render(<Harness submit={() => result} />);
    const user = await open();
    await fillAndSubmit(user);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByLabelText("Name")).toHaveAttribute("readonly");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Discard changes" }));
    await act(async () => {
      finish?.("done");
      await result;
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("keeps the form open when requested, then returns focus on success", async () => {
    const submit = vi
      .fn<(values: Values) => Promise<"done" | "keep-open">>()
      .mockResolvedValueOnce("keep-open")
      .mockResolvedValueOnce("done");
    render(<Harness submit={submit} />);
    const user = await open();
    await fillAndSubmit(user);
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create",
      }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Create record" })).toHaveFocus();
  });
});
