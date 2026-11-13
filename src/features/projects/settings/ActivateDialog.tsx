import { useState } from "react";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { ReasonField } from "@/components/ReasonField";
import type { ProjectDetail } from "@/features/projects/api/types";
import type { ProjectSettingsActions } from "@/features/projects/model/useProjectSettingsActions";
import { computeReadiness } from "@/features/projects/model/readiness";
import { activationFeedback } from "@/features/projects/settings/ActivationFeedback";
import { ACTIVATION_CONSEQUENCE } from "@/features/projects/settings/readinessItems";
export function ActivateDialog({
  project,
  requiresWaiver,
  blocked,
  actions,
}: {
  project: ProjectDetail;
  requiresWaiver: boolean;
  blocked: boolean;
  actions: ProjectSettingsActions;
}) {
  const [version, setVersion] = useState(project.version),
    [waiver, setWaiver] = useState(requiresWaiver),
    [reloadBlocked, setReloadBlocked] = useState(false),
    [validWaiver, setValidWaiver] = useState(false);
  const schema = z.object({
    reason: z
      .string()
      .trim()
      .max(2000, "Use 2,000 characters or fewer.")
      .refine((value) => !waiver || value.length > 0, "Enter a reason."),
  });
  return (
    <FormDialog
      title="Activate project"
      description={ACTIVATION_CONSEQUENCE}
      trigger={<Button disabled={blocked}>Activate project</Button>}
      submitLabel="Activate project"
      schema={schema}
      defaultValues={{ reason: "" }}
      submitDisabled={blocked || reloadBlocked || (waiver && !validWaiver)}
      errorPresentation={activationFeedback}
      onOpenChange={(open) => {
        if (open) {
          setVersion(project.version);
          setWaiver(requiresWaiver);
          setReloadBlocked(false);
          setValidWaiver(false);
        }
      }}
      onReload={async () => {
        const result = await actions.reload(),
          gaps = computeReadiness(
            result.project,
            result.brief,
            result.participants,
          );
        setVersion(result.project.version);
        setValidWaiver(false);
        setWaiver(gaps.includes("ClientProductOwnerWaiver"));
        setReloadBlocked(
          !result.project.permissions.activate ||
            gaps.some((gap) => gap !== "ClientProductOwnerWaiver"),
        );
        return { reason: "" };
      }}
      onSubmit={(values) =>
        actions.run({
          action: "activate",
          request: {
            expectedVersion: version,
            clientPoWaiverReason: waiver ? values.reason : null,
          },
        })
      }
    >
      {(form) => (
        <>
          {waiver ? (
            <ReasonField
              id="activation-waiver"
              required
              label="Reason for activating without a client Product Owner"
              value={form.watch("reason")}
              error={form.formState.errors.reason?.message}
              {...form.register("reason")}
              onChange={(event) => {
                const value = event.target.value.trim();
                setValidWaiver(value.length > 0 && value.length <= 2000);
                void form.register("reason").onChange(event);
              }}
            />
          ) : null}
          {reloadBlocked ? (
            <p role="alert">
              Complete every required setup step before activating.
            </p>
          ) : null}
        </>
      )}
    </FormDialog>
  );
}
