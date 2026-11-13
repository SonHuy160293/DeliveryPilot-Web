import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ApiFeedback } from "@/components/ApiFeedback";
import { Button } from "@/components/ui/button";
import { useDeniedCleanup } from "@/lib/query/useDeniedCleanup";
import {
  projectParticipantsQuery,
  projectInvitationsQuery,
  projectTeamContextQuery,
} from "@/features/projects/api/queries";
import { useProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import type { ProjectTeamProps } from "@/features/projects/team/types";
import { ClientPoCard } from "@/features/projects/team/ClientPoCard";
import { TeamTable } from "@/features/projects/team/TeamTable";
import { InviteGuestDialog } from "@/features/projects/team/InviteGuestDialog";
import { GuestInvitationList } from "@/features/projects/team/GuestInvitationList";
import { LeaveProjectButton } from "@/features/projects/team/LeaveProjectButton";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
export function ProjectTeamTab({
  scope,
  project,
  onSuccess,
  onUnavailable,
  addParticipant,
}: ProjectTeamProps & {
  addParticipant?: (
    actions: ProjectTeamActions,
    activeUserIds: readonly string[],
  ) => ReactNode;
}) {
  const participants = useQuery(projectParticipantsQuery(scope, project.id));
  const invitations = useQuery({
    ...projectInvitationsQuery(scope, project.id),
    enabled: project.permissions.manageGuests,
  });
  const context = useQuery({
    ...projectTeamContextQuery(scope, project.id),
    enabled: project.kind === "Client" && project.permissions.assignClientPo,
  });
  useDeniedCleanup(
    invitations.error,
    projectInvitationsQuery(scope, project.id).queryKey,
  );
  useDeniedCleanup(
    context.error,
    projectTeamContextQuery(scope, project.id).queryKey,
  );
  const actions = useProjectTeamActions(
    scope,
    project.id,
    onSuccess,
    onUnavailable,
  );
  const error = participants.error;
  useEffect(() => {
    if (isProjectUnavailable(error)) onUnavailable(error);
  }, [error, onUnavailable]);
  const rows =
    participants.data?.filter((item) => item.status === "Active") ?? [];
  if (error)
    return (
      <div className="flex flex-col gap-3">
        <ApiFeedback error={error} />
        <Button
          variant="outline"
          disabled={participants.isFetching}
          onClick={() => {
            void participants.refetch();
          }}
        >
          Retry loading team
        </Button>
      </div>
    );
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {!participants.isPending ? (
        <ClientPoCard
          project={project}
          participants={rows}
          defaults={
            context.error
              ? []
              : (context.data?.engagementDefaultParticipantIds ?? [])
          }
          actions={actions}
        />
      ) : null}
      {context.error && project.permissions.assignClientPo ? (
        <div className="flex flex-col gap-2">
          <ApiFeedback error={context.error} />
          <Button
            variant="outline"
            disabled={context.isFetching}
            onClick={() => {
              void context.refetch();
            }}
          >
            Retry loading engagement default
          </Button>
        </div>
      ) : null}
      <section aria-label="Team" className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold">Team ({rows.length})</h3>
          <div className="flex flex-col gap-3 md:flex-row">
            {!participants.isPending && project.permissions.manageParticipants
              ? addParticipant?.(
                  actions,
                  rows.map((row) => row.userId),
                )
              : null}
            {!participants.isPending && project.permissions.manageGuests ? (
              <InviteGuestDialog actions={actions} />
            ) : null}
          </div>
        </div>
        <TeamTable
          rows={rows}
          permissions={project.permissions}
          actions={actions}
          loading={participants.isPending}
        />
      </section>
      {project.permissions.manageGuests ? (
        invitations.isPending ? (
          <p role="status">Loading pending guest invitations…</p>
        ) : invitations.error ? (
          <div className="flex flex-col gap-2">
            <ApiFeedback error={invitations.error} />
            <Button
              variant="outline"
              disabled={invitations.isFetching}
              onClick={() => {
                void invitations.refetch();
              }}
            >
              Retry loading invitations
            </Button>
          </div>
        ) : (
          <GuestInvitationList
            invitations={invitations.data ?? []}
            actions={actions}
          />
        )
      ) : null}
      {project.myParticipantKind === "Guest" ? (
        <LeaveProjectButton
          scope={scope}
          projectId={project.id}
          projectName={project.name}
        />
      ) : null}
    </div>
  );
}
