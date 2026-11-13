import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { useDialogSnapshot } from "@/features/engagements/model/useDialogSnapshot";
import { reasonForm } from "@/features/engagements/model/detailForms";
import { FormDialog } from "@/components/FormDialog";
import { ReasonField } from "@/components/ReasonField";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function EngagementStatusDialog({
  engagement,
  actions,
}: {
  engagement: EngagementDetail;
  actions: EngagementActions;
}) {
  const dialog = useDialogSnapshot(engagement, actions);
  const [intentStatus, setIntentStatus] = useState(engagement.status);
  const closing = intentStatus === "Active";
  const label = closing ? "Close engagement" : "Reopen engagement";
  return (
    <FormDialog
      title={`${label}: ${engagement.clientDisplayName}`}
      description={
        closing
          ? "Edits and new projects will be blocked. Existing projects keep working."
          : "Reopen it to make changes."
      }
      trigger={
        <Button variant="outline" disabled={actions.pending}>
          {engagement.status === "Active"
            ? "Close engagement"
            : "Reopen engagement"}
        </Button>
      }
      submitLabel={label}
      submitDisabled={dialog.snapshot.status !== intentStatus}
      schema={reasonForm}
      defaultValues={{ reason: "" }}
      onOpenChange={(open) => {
        if (open) setIntentStatus(engagement.status);
        dialog.onOpenChange(open);
      }}
      onReload={async () => {
        await dialog.reload();
        return { reason: "" };
      }}
      onSubmit={(values) =>
        actions.run(
          {
            action: closing ? "close" : "reopen",
            request: {
              expectedVersion: dialog.snapshot.version,
              reason: values.reason,
            },
          },
          closing ? "Engagement closed." : "Engagement reopened.",
        )
      }
    >
      {(form) => (
        <ReasonField
          required
          id="engagement-status-reason"
          readOnly={dialog.snapshot.status !== intentStatus}
          error={form.formState.errors.reason?.message}
          {...form.register("reason")}
          value={form.watch("reason")}
        />
      )}
    </FormDialog>
  );
}
