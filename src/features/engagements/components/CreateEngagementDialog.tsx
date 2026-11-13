import { useMemo } from "react";
import { FormDialog } from "@/components/FormDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import {
  createFormSchema,
  emptyCreateValues,
} from "@/features/engagements/model/createForm";
import { useEngagementCreation } from "@/features/engagements/model/useEngagementCreation";
import { CreateEngagementFields } from "@/features/engagements/components/CreateEngagementFields";
import type { EngagementScope } from "@/features/engagements/api/queries";
import type { CreateEngagementResult } from "@/features/engagements/api/types";

export function CreateEngagementDialog({
  scope,
  onCreated,
  open,
  onOpenChange,
}: {
  scope: EngagementScope;
  onCreated: (result: CreateEngagementResult) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const creation = useEngagementCreation(scope);
  const defaults = useMemo(
    () =>
      creation.uncertain && creation.attempt
        ? {
            ...emptyCreateValues,
            ...creation.attempt.request,
            engagementName: creation.attempt.request.engagementName ?? "",
            clientLegalName: creation.attempt.request.clientLegalName ?? "",
            clientCountryCode: creation.attempt.request.clientCountryCode ?? "",
            documentUrl: creation.attempt.request.documentUrl ?? "",
          }
        : emptyCreateValues,
    [creation.uncertain, creation.attempt],
  );
  return (
    <FormDialog
      title="Create engagement"
      trigger={<Button>Create engagement</Button>}
      submitLabel="Create engagement"
      description="Contract model: fixed price. You can add contract value and milestones after creating the engagement."
      schema={createFormSchema}
      defaultValues={defaults}
      open={open}
      onOpenChange={onOpenChange}
      errorPresentation={(error) =>
        error instanceof ApiError && error.kind === "forbidden" ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>
              You no longer have permission to create engagements.
            </AlertDescription>
          </Alert>
        ) : null
      }
      onSubmit={async (request) => {
        const result = await creation.submit(request);
        if (!result) return "keep-open";
        onCreated(result);
        return "done";
      }}
    >
      {(form) => (
        <CreateEngagementFields form={form} locked={creation.uncertain} />
      )}
    </FormDialog>
  );
}
