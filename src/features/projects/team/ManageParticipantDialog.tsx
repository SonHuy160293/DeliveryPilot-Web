import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type {
  Participant,
  ProjectPermissions,
} from "@/features/projects/api/types";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { ChangeRolesDialog } from "@/features/projects/team/ChangeRolesDialog";
import { TeamConfirmAction } from "@/features/projects/team/TeamConfirmAction";
export function ManageParticipantDialog({
  participant,
  permissions,
  actions,
}: {
  participant: Participant;
  permissions: ProjectPermissions;
  actions: ProjectTeamActions;
}) {
  const [open, setOpen] = useState(false);
  const managedActions: ProjectTeamActions = {
    ...actions,
    run: async (input, message) => {
      const result = await actions.run(input, message);
      if (result === "done") setOpen(false);
      return result;
    },
  };
  const name = participant.displayName?.trim() || "Name unavailable",
    guest = participant.kind === "Guest",
    admin = participant.roles.includes("ProjectAdministrator");
  const canRemove = !admin || permissions.manageAdministrators;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full md:w-auto"
          aria-label={`Manage ${name}`}
        >
          Manage
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-0 grid-cols-1 break-words">
        <DialogHeader>
          <DialogTitle>Manage {name}</DialogTitle>
          <DialogDescription>
            Manage project roles and access.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <ChangeRolesDialog
            participant={participant}
            permissions={permissions}
            actions={managedActions}
          />
          {!guest && permissions.manageAdministrators ? (
            admin ? (
              <ChangeRolesDialog
                participant={participant}
                permissions={permissions}
                actions={managedActions}
                removeAdministrator
              />
            ) : (
              <TeamConfirmAction
                label="Make project admin"
                target={name}
                consequence="Change this member's project administrator role."
                actions={managedActions}
                request={() => ({
                  action: "changeRoles",
                  participantId: participant.id,
                  request: {
                    roles: [...participant.roles, "ProjectAdministrator"],
                    expectedVersion: participant.version,
                  },
                })}
                success="Roles updated."
              />
            )
          ) : null}
          {canRemove ? (
            <TeamConfirmAction
              label={guest ? "Revoke guest access" : "Remove from project"}
              target={name}
              optionalReason
              consequence="They lose access to this project on their next action. Their past work stays attributed to them."
              additionalConsequence={
                guest && participant.isClientProductOwner
                  ? `${name} is the client Product Owner. Revoking also removes that assignment.`
                  : undefined
              }
              actions={managedActions}
              request={(reason) => ({
                action: "endParticipation",
                participantId: participant.id,
                request: { expectedVersion: participant.version, reason },
              })}
              success={
                guest ? "Guest access revoked." : "Removed from the project."
              }
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
