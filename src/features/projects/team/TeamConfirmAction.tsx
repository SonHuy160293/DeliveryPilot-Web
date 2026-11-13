import { useState } from "react";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { ReasonField } from "@/components/ReasonField";
import { Button } from "@/components/ui/button";
import type { ProjectWrite } from "@/features/projects/api/queries";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { teamActionFeedback } from "@/features/projects/team/TeamActionFeedback";
const schema = z.object({
  reason: z.string().trim().max(2000, "Use 2,000 characters or fewer."),
});
export function TeamConfirmAction({
  label,
  triggerLabel,
  target,
  consequence,
  additionalConsequence,
  optionalReason = false,
  actions,
  request,
  success,
}: {
  label: string;
  triggerLabel?: string;
  target: string;
  consequence: string;
  additionalConsequence?: string;
  optionalReason?: boolean;
  actions: ProjectTeamActions;
  request: (reason: string | null) => ProjectWrite;
  success: string;
}) {
  const [intent, setIntent] = useState(() => request(null));
  return (
    <FormDialog
      title={`${label}: ${target}`}
      description={consequence}
      trigger={
        <Button
          variant="outline"
          className="w-full whitespace-normal md:w-auto"
        >
          {triggerLabel ?? label}
        </Button>
      }
      submitLabel={label}
      submitDisabled={actions.blocked && intent.action === "resendInvitation"}
      schema={schema}
      defaultValues={{ reason: "" }}
      errorPresentation={teamActionFeedback}
      onOpenChange={(open) => {
        if (open) {
          actions.reset();
          setIntent(request(null));
        }
      }}
      onReload={async () => {
        setIntent(await actions.refresh(intent));
        return { reason: "" };
      }}
      onSubmit={(values) =>
        actions.run(
          intent.action === "endParticipation"
            ? {
                ...intent,
                request: { ...intent.request, reason: values.reason || null },
              }
            : intent,
          success,
        )
      }
    >
      {(form) => (
        <>
          {additionalConsequence ? (
            <p className="text-sm text-muted-foreground">
              {additionalConsequence}
            </p>
          ) : null}
          {optionalReason ? (
            <ReasonField
              id="team-action-reason"
              required={false}
              value={form.watch("reason")}
              error={form.formState.errors.reason?.message}
              {...form.register("reason")}
            />
          ) : null}
        </>
      )}
    </FormDialog>
  );
}
