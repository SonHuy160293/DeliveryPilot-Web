import { FormDialog } from "@/components/FormDialog";
import { FormField } from "@/components/FormField";
import { ReasonField } from "@/components/ReasonField";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { useDialogSnapshot } from "@/features/engagements/model/useDialogSnapshot";
import { dateForm } from "@/features/engagements/model/detailForms";

export function ChangeMilestoneDateDialog({
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
  const values = (row: EngagementDetail) => ({
    targetDate:
      row.milestones.find((milestone) => milestone.id === milestoneId)
        ?.currentTargetDate ?? "",
    reason: "",
  });
  return (
    <FormDialog
      title={`Change date: ${item?.name ?? "Milestone"}`}
      submitLabel="Change date"
      description={`Original date ${formatDate(item?.originalTargetDate ?? null)} stays recorded.`}
      trigger={
        <Button variant="outline" disabled={actions.pending}>
          Change date
        </Button>
      }
      schema={dateForm}
      defaultValues={values(dialog.snapshot)}
      submitDisabled={readOnly}
      onOpenChange={dialog.onOpenChange}
      onReload={async () => values(await dialog.reload())}
      onSubmit={(input) =>
        item
          ? actions.run(
              {
                action: "changeMilestoneDate",
                milestoneId: item.id,
                request: {
                  expectedVersion: item.version,
                  targetDate: input.targetDate,
                  reason: input.reason,
                },
              },
              "Milestone date changed.",
            )
          : Promise.resolve("keep-open")
      }
    >
      {(form) => (
        <>
          {readOnly ? <p>This milestone is read-only.</p> : null}
          <FormField
            id="milestone-new-target"
            label="New target date"
            type="date"
            required
            readOnly={readOnly}
            error={form.formState.errors.targetDate?.message}
            {...form.register("targetDate")}
          />
          <ReasonField
            id="milestone-date-reason"
            required
            readOnly={readOnly}
            error={form.formState.errors.reason?.message}
            {...form.register("reason")}
            value={form.watch("reason")}
          />
        </>
      )}
    </FormDialog>
  );
}
