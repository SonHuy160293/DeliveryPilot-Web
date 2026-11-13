import { useState } from "react";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import type {
  Participant,
  ProjectPermissions,
} from "@/features/projects/api/types";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { RoleChecklist } from "@/features/projects/team/RoleChecklist";
import { teamActionFeedback } from "@/features/projects/team/TeamActionFeedback";
const schema = z.object({
  roles: z
    .array(
      z.enum([
        "ProjectAdministrator",
        "ProjectManager",
        "BusinessAnalyst",
        "Developer",
        "QualityAssurance",
        "DevOps",
        "Viewer",
      ]),
    )
    .min(
      1,
      "Choose at least one role. To remove the person, use Remove from project.",
    ),
});
export function ChangeRolesDialog({
  participant,
  permissions,
  actions,
  removeAdministrator = false,
}: {
  participant: Participant;
  permissions: ProjectPermissions;
  actions: ProjectTeamActions;
  removeAdministrator?: boolean;
}) {
  const [snapshot, setSnapshot] = useState(participant);
  const name = participant.displayName?.trim() || "Name unavailable",
    label = removeAdministrator ? "Remove project admin" : "Change roles";
  const roles = removeAdministrator
    ? snapshot.roles.filter((role) => role !== "ProjectAdministrator")
    : snapshot.roles;
  return (
    <FormDialog
      title={`${label}: ${name}`}
      description={
        removeAdministrator
          ? "Choose the roles this member will retain."
          : "Choose this person's project roles."
      }
      trigger={<Button variant="outline">{label}</Button>}
      submitLabel="Save roles"
      schema={schema}
      defaultValues={{ roles }}
      errorPresentation={teamActionFeedback}
      onOpenChange={(open) => {
        if (open) {
          setSnapshot(participant);
          actions.reset();
        }
      }}
      onReload={async () => {
        const result = await actions.reload(),
          target = result.participants.find(
            (item) => item.id === participant.id && item.status === "Active",
          );
        if (!target) throw new ApiError("not-found", "Participant unavailable");
        setSnapshot(target);
        return {
          roles: removeAdministrator
            ? target.roles.filter((role) => role !== "ProjectAdministrator")
            : target.roles,
        };
      }}
      onSubmit={(values) =>
        actions.run(
          {
            action: "changeRoles",
            participantId: participant.id,
            request: { roles: values.roles, expectedVersion: snapshot.version },
          },
          "Roles updated.",
        )
      }
    >
      {(form) => (
        <RoleChecklist
          onBlur={() => {
            void form.trigger("roles");
          }}
          value={form.watch("roles")}
          onChange={(next) => {
            form.setValue("roles", next, {
              shouldDirty: true,
              shouldValidate:
                form.formState.isSubmitted || !!form.formState.errors.roles,
            });
          }}
          allowAdministrator={
            permissions.manageAdministrators && !removeAdministrator
          }
          forGuest={participant.kind === "Guest"}
          disabled={form.formState.isSubmitting}
          error={form.formState.errors.roles?.message}
        />
      )}
    </FormDialog>
  );
}
