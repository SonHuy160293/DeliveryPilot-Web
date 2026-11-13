import { useState } from "react";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { StakeholderFields } from "@/features/projects/stakeholders/StakeholderFields";
import {
  stakeholderForm,
  stakeholderValues,
} from "@/features/projects/stakeholders/form";
import type { StakeholderActions } from "@/features/projects/model/useStakeholderActions";
import type { Stakeholder, Participant } from "@/features/projects/api/types";
export function StakeholderDialog({
  stakeholder,
  participants,
  actions,
}: {
  stakeholder?: Stakeholder;
  participants: Participant[];
  actions: StakeholderActions;
}) {
  const [snapshot, setSnapshot] = useState(stakeholder);
  return (
    <FormDialog
      title={
        stakeholder
          ? `Edit stakeholder: ${stakeholder.name}`
          : "Add stakeholder"
      }
      trigger={
        <Button variant={stakeholder ? "outline" : "default"}>
          {stakeholder ? "Edit" : "Add stakeholder"}
        </Button>
      }
      submitLabel={stakeholder ? "Save stakeholder" : "Add stakeholder"}
      schema={stakeholderForm}
      defaultValues={stakeholderValues(snapshot)}
      onOpenChange={(open) => {
        if (open) setSnapshot(stakeholder);
      }}
      onReload={async () => {
        const rows = await actions.reload(),
          latest = rows.find(
            (row) => row.id === stakeholder?.id && !row.retiredAt,
          );
        if (stakeholder && !latest)
          throw new ApiError("not-found", "Stakeholder unavailable");
        setSnapshot(latest);
        return stakeholderValues(latest);
      }}
      onSubmit={(values) =>
        actions.run(
          {
            action: "saveStakeholder",
            stakeholderId: stakeholder?.id ?? null,
            request: {
              ...values,
              organizationName: values.organizationName || null,
              responsibilities: values.responsibilities || null,
              decisionAreas: values.decisionAreas || null,
              email: values.email || null,
              participantId: values.participantId || null,
              version: snapshot?.version ?? 1,
            },
          },
          "Stakeholder saved.",
        )
      }
    >
      {(form) => <StakeholderFields form={form} participants={participants} />}
    </FormDialog>
  );
}
