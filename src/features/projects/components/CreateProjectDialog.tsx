import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ApiError } from "@/lib/api/apiError";
import type { ProjectScope } from "@/features/projects/api/queries";
import type {
  ProjectDetail,
  ProjectEngagementRef,
} from "@/features/projects/api/types";
import {
  createProjectForm,
  type CreateProjectValues,
} from "@/features/projects/model/createForm";
import { useProjectCreation } from "@/features/projects/model/useProjectCreation";
import { CreateProjectFields } from "@/features/projects/components/CreateProjectFields";
import { useState } from "react";
export function CreateProjectDialog({
  scope,
  engagements,
  defaultEngagementId,
  open,
  onOpenChange,
  onCreated,
}: {
  scope: ProjectScope;
  engagements: readonly ProjectEngagementRef[];
  defaultEngagementId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (project: ProjectDetail) => void;
}) {
  const creation = useProjectCreation(scope);
  const defaultId = engagements.some((item) => item.id === defaultEngagementId)
    ? (defaultEngagementId ?? "")
    : "";
  const base: CreateProjectValues = {
    name: "",
    purpose: "",
    kind: engagements.length ? "Client" : "Internal",
    engagementId: defaultId,
  };
  const [defaults, setDefaults] = useState(base);
  return (
    <FormDialog<CreateProjectValues>
      title="Create project"
      submitLabel="Create project"
      schema={createProjectForm}
      defaultValues={defaults}
      open={open}
      onOpenChange={(next) => {
        if (next)
          setDefaults(
            creation.attempt
              ? {
                  ...creation.attempt.request,
                  engagementId: creation.attempt.request.engagementId ?? "",
                }
              : base,
          );
        onOpenChange(next);
      }}
      trigger={<Button>Create project</Button>}
      errorPresentation={(error) =>
        error instanceof ApiError &&
        error.details.code === "Project.EngagementClosed" ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              This engagement is closed. Choose an active engagement.
            </AlertDescription>
          </Alert>
        ) : undefined
      }
      onSubmit={async (values) => {
        const result = await creation.submit({
          name: values.name,
          purpose: values.purpose,
          kind: values.kind,
          engagementId: values.kind === "Client" ? values.engagementId : null,
        });
        if (result) onCreated(result);
        return "keep-open";
      }}
    >
      {(form) => (
        <CreateProjectFields
          form={form}
          engagements={engagements}
          uncertain={creation.uncertain}
        />
      )}
    </FormDialog>
  );
}
