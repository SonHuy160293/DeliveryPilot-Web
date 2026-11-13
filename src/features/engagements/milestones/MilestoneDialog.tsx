import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { useDialogSnapshot } from "@/features/engagements/model/useDialogSnapshot";
import {
  addMilestoneForm,
  milestoneForm,
} from "@/features/engagements/model/detailForms";
import {
  MilestoneFields,
  type MilestoneValues,
} from "@/features/engagements/milestones/MilestoneFields";

const schema: z.ZodType<MilestoneValues, MilestoneValues> = milestoneForm
  .extend({ targetDate: z.string().optional() })
  .superRefine((values, context) => {
    if (values.targetDate !== undefined) {
      const result = addMilestoneForm.shape.targetDate.safeParse(
        values.targetDate,
      );
      if (!result.success)
        context.addIssue({
          code: "custom",
          path: ["targetDate"],
          message: "Enter a target date.",
        });
    }
  });
export function MilestoneDialog({
  engagement,
  milestoneId,
  actions,
}: {
  engagement: EngagementDetail;
  milestoneId?: string;
  actions: EngagementActions;
}) {
  const dialog = useDialogSnapshot(engagement, actions);
  const adding = !milestoneId;
  const item = dialog.snapshot.milestones.find((row) => row.id === milestoneId);
  const readOnly =
    dialog.snapshot.status !== "Active" ||
    (!adding && (!item || !["Planned", "Missed"].includes(item.status)));
  const values = (row: EngagementDetail): MilestoneValues => {
    const milestone = row.milestones.find((value) => value.id === milestoneId);
    return adding
      ? { name: "", description: "", targetDate: "" }
      : {
          name: milestone?.name ?? "",
          description: milestone?.description ?? "",
        };
  };
  const label = adding ? "Add milestone" : "Edit milestone";
  return (
    <FormDialog<MilestoneValues>
      title={adding ? label : `${label}: ${item?.name ?? "Milestone"}`}
      submitLabel={label}
      trigger={
        <Button variant="outline" disabled={actions.pending}>
          {adding ? label : "Edit"}
        </Button>
      }
      schema={schema}
      defaultValues={values(dialog.snapshot)}
      submitDisabled={readOnly}
      onOpenChange={dialog.onOpenChange}
      onReload={async () => values(await dialog.reload())}
      onSubmit={(input) => {
        if (adding)
          return actions.run(
            {
              action: "addMilestone",
              request: {
                expectedVersion: dialog.snapshot.version,
                name: input.name,
                description: input.description || null,
                targetDate: input.targetDate ?? "",
              },
            },
            "Milestone added.",
          );
        if (!item) return Promise.resolve("keep-open");
        return actions.run(
          {
            action: "editMilestone",
            milestoneId: item.id,
            request: {
              expectedVersion: item.version,
              name: input.name,
              description: input.description || null,
            },
          },
          "Milestone updated.",
        );
      }}
    >
      {(form) => (
        <>
          {readOnly ? <p>This milestone is read-only.</p> : null}
          <MilestoneFields form={form} adding={adding} readOnly={readOnly} />
        </>
      )}
    </FormDialog>
  );
}
