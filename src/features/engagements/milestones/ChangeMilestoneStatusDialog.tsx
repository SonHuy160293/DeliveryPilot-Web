import { useContext } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { ReasonField } from "@/components/ReasonField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormReadOnlyContext } from "@/lib/formReadOnly";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { useDialogSnapshot } from "@/features/engagements/model/useDialogSnapshot";
import { statusForm } from "@/features/engagements/model/detailForms";

function StatusFields({
  form,
  missed,
  readOnly,
}: {
  form: UseFormReturn<z.infer<typeof statusForm>>;
  missed: boolean;
  readOnly: boolean;
}) {
  const pending = useContext(FormReadOnlyContext);
  return (
    <>
      <fieldset
        disabled={readOnly || pending}
        className="flex flex-col gap-3"
        aria-describedby={
          form.formState.errors.status ? "milestone-status-error" : undefined
        }
      >
        <legend className="mb-3 text-sm font-medium">Status</legend>
        {(["Achieved", "Missed", "Retired"] as const)
          .filter((status) => !missed || status !== "Missed")
          .map((status) => (
            <div key={status} className="flex items-center gap-3">
              <input
                type="radio"
                id={`milestone-status-${status}`}
                value={status}
                className="size-6 accent-primary focus-visible:ring-2 focus-visible:ring-ring"
                {...form.register("status")}
              />
              <Label htmlFor={`milestone-status-${status}`}>{status}</Label>
            </div>
          ))}
        {form.formState.errors.status ? (
          <p
            id="milestone-status-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {form.formState.errors.status.message}
          </p>
        ) : null}
      </fieldset>
      <ReasonField
        id="milestone-status-reason"
        required={false}
        readOnly={readOnly}
        error={form.formState.errors.reason?.message}
        {...form.register("reason")}
        value={form.watch("reason")}
      />
    </>
  );
}
export function ChangeMilestoneStatusDialog({
  engagement,
  milestoneId,
  actions,
}: {
  engagement: EngagementDetail;
  milestoneId: string;
  actions: EngagementActions;
}) {
  const dialog = useDialogSnapshot(engagement, actions);
  const item = dialog.snapshot.milestones.find((row) => row.id === milestoneId);
  const readOnly =
    dialog.snapshot.status !== "Active" ||
    !item ||
    !["Planned", "Missed"].includes(item.status);
  return (
    <FormDialog<z.infer<typeof statusForm>>
      title={`Change status: ${item?.name ?? "Milestone"}`}
      submitLabel="Change status"
      trigger={
        <Button variant="outline" disabled={actions.pending}>
          Change status
        </Button>
      }
      schema={statusForm}
      defaultValues={{ status: "Achieved", reason: "" }}
      submitDisabled={readOnly}
      onOpenChange={dialog.onOpenChange}
      onReload={async () => {
        await dialog.reload();
        return { status: "Achieved", reason: "" };
      }}
      onSubmit={(input) =>
        item
          ? actions.run(
              {
                action: "changeMilestoneStatus",
                milestoneId: item.id,
                request: {
                  expectedVersion: item.version,
                  status: input.status,
                  reason: input.reason || null,
                },
              },
              `Milestone marked ${input.status}.`,
            )
          : Promise.resolve("keep-open")
      }
    >
      {(form) => (
        <>
          {readOnly ? <p>This milestone is read-only.</p> : null}
          <StatusFields
            form={form}
            missed={item?.status === "Missed"}
            readOnly={readOnly}
          />
        </>
      )}
    </FormDialog>
  );
}
