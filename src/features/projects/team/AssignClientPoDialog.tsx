import { useState } from "react";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Participant, ProjectDetail } from "@/features/projects/api/types";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { teamActionFeedback } from "@/features/projects/team/TeamActionFeedback";
const schema = z.object({
  participantId: z.string().min(1, "Choose an active guest."),
});
export function AssignClientPoDialog({
  project,
  guests,
  defaults,
  actions,
}: {
  project: ProjectDetail;
  guests: Participant[];
  defaults: readonly string[];
  actions: ProjectTeamActions;
}) {
  const [version, setVersion] = useState(project.version);
  const label = project.clientProductOwner ? "Change" : "Assign client PO";
  return (
    <div className="flex flex-col gap-2">
      {!guests.length ? (
        <p className="text-sm text-muted-foreground">
          Invite a guest before assigning a client Product Owner.
        </p>
      ) : null}
      <FormDialog
        title="Assign client PO"
        trigger={
          <Button variant="outline" disabled={!guests.length}>
            {label}
          </Button>
        }
        submitLabel="Assign client PO"
        schema={schema}
        defaultValues={{
          participantId: project.clientProductOwner?.participantId ?? "",
        }}
        errorPresentation={teamActionFeedback}
        onOpenChange={(open) => {
          if (open) {
            setVersion(project.version);
            actions.reset();
          }
        }}
        onReload={async () => {
          const result = await actions.reload();
          setVersion(result.project.version);
          return {
            participantId:
              result.project.clientProductOwner?.participantId ?? "",
          };
        }}
        onSubmit={(values) =>
          actions.run(
            {
              action: "assignClientPo",
              participantId: values.participantId,
              expectedVersion: version,
            },
            `${guests.find((guest) => guest.id === values.participantId)?.displayName?.trim() || "Name unavailable"} is now the client Product Owner.`,
          )
        }
      >
        {(form) => (
          <div className="flex flex-col gap-2">
            <Label htmlFor="client-po-guest">Guest</Label>
            <Select
              value={form.watch("participantId")}
              disabled={form.formState.isSubmitting}
              onValueChange={(value) => {
                form.setValue("participantId", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            >
              <SelectTrigger
                id="client-po-guest"
                aria-invalid={!!form.formState.errors.participantId}
                aria-describedby={
                  form.formState.errors.participantId
                    ? "client-po-error"
                    : undefined
                }
                onBlur={() => {
                  void form.trigger("participantId");
                }}
              >
                <SelectValue placeholder="Choose an active guest" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {guests.map((guest) => (
                    <SelectItem key={guest.id} value={guest.id}>
                      {guest.displayName?.trim() || "Name unavailable"}
                      {defaults.includes(guest.id)
                        ? " · Engagement default"
                        : ""}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {form.formState.errors.participantId ? (
              <p
                id="client-po-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {form.formState.errors.participantId.message}
              </p>
            ) : null}
          </div>
        )}
      </FormDialog>
    </div>
  );
}
