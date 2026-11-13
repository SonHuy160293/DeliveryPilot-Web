import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FormDialog } from "@/components/FormDialog";
import { ApiFeedback } from "@/components/ApiFeedback";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  projectEngagementOptionsQuery,
  type ProjectScope,
} from "@/features/projects/api/queries";
import type { ProjectDetail } from "@/features/projects/api/types";
import type { ProjectSettingsActions } from "@/features/projects/model/useProjectSettingsActions";
import { ApiError } from "@/lib/api/apiError";
import { useDeniedCleanup } from "@/lib/query/useDeniedCleanup";
import { changeEngagementForm as schema } from "@/features/projects/model/settingsForms";
import { ChangeEngagementFields } from "@/features/projects/settings/ChangeEngagementFields";
export function ChangeEngagementDialog({
  scope,
  project,
  actions,
}: {
  scope: ProjectScope;
  project: ProjectDetail;
  actions: ProjectSettingsActions;
}) {
  const [open, setOpen] = useState(false),
    [snapshot, setSnapshot] = useState(project);
  const query = useQuery({
    ...projectEngagementOptionsQuery(scope, project.id),
    enabled: open && project.permissions.changeEngagement,
  });
  const { data, error, isPending, isFetching, refetch } = query;
  useDeniedCleanup(
    error,
    projectEngagementOptionsQuery(scope, project.id).queryKey,
  );
  const defaults = {
    kind: snapshot.kind,
    engagementId: snapshot.engagement?.id ?? "",
    reason: "",
  };
  return (
    <FormDialog
      title="Change engagement"
      description="Fixed once the project is active."
      trigger={<Button variant="outline">Change</Button>}
      submitLabel="Change engagement"
      schema={schema}
      defaultValues={defaults}
      open={open}
      onOpenChange={(next) => {
        if (next) setSnapshot(project);
        setOpen(next);
      }}
      submitDisabled={
        isPending || !!error || !project.permissions.changeEngagement
      }
      onReload={async () => {
        const result = await actions.reload();
        setSnapshot(result.project);
        return {
          kind: result.project.kind,
          engagementId: result.project.engagement?.id ?? "",
          reason: "",
        };
      }}
      errorPresentation={(failure) =>
        failure instanceof ApiError &&
        failure.details.code === "Project.EngagementClosed" ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              This engagement is closed. Choose an active engagement.
            </AlertDescription>
          </Alert>
        ) : undefined
      }
      onSubmit={(values) =>
        actions.run({
          action: "changeEngagement",
          request: {
            kind: values.kind,
            engagementId: values.kind === "Client" ? values.engagementId : null,
            reason: values.reason,
            expectedVersion: snapshot.version,
          },
        })
      }
    >
      {(form) => (
        <>
          {isPending ? (
            <p role="status">Loading engagements…</p>
          ) : error ? (
            <>
              <ApiFeedback error={error} />
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={() => {
                  void refetch();
                }}
              >
                Retry loading engagements
              </Button>
            </>
          ) : null}
          <ChangeEngagementFields
            form={form}
            engagements={data ?? []}
            blocked={isPending || !!error}
          />
        </>
      )}
    </FormDialog>
  );
}
