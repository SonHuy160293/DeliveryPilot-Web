import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  projectBriefQuery,
  projectOverviewContextQuery,
  projectParticipantsQuery,
  type ProjectScope,
} from "@/features/projects/api/queries";
import type { ProjectDetail } from "@/features/projects/api/types";
import { useProjectBriefActions } from "@/features/projects/model/useProjectBriefActions";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import { computeReadiness } from "@/features/projects/model/readiness";
import { ProjectLoading } from "@/features/projects/components/ProjectLoading";
import { ProjectDetailError } from "@/features/projects/components/ProjectDetailError";
import { SetupCallout } from "@/features/projects/brief/SetupCallout";
import { ProductGoalCard } from "@/features/projects/brief/ProductGoalCard";
import { BriefGrid } from "@/features/projects/brief/BriefGrid";
import { EngagementSummaryCard } from "@/features/projects/brief/EngagementSummaryCard";
import { ProjectFacts } from "@/features/projects/brief/ProjectFacts";
import type { ProjectShareBadgeComponent } from "@/features/projects/brief/shareTypes";
export function ProjectOverviewTab({
  scope,
  project,
  onSuccess,
  onUnavailable,
  ShareBadgeComponent,
}: {
  scope: ProjectScope;
  project: ProjectDetail;
  onSuccess: (message: string) => void;
  onUnavailable: (error: unknown) => void;
  ShareBadgeComponent?: ProjectShareBadgeComponent;
}) {
  const brief = useQuery(projectBriefQuery(scope, project.id));
  const context = useQuery(projectOverviewContextQuery(scope, project.id));
  const setup =
    project.status === "Draft" &&
    project.myRoles.includes("ProjectAdministrator");
  const participants = useQuery({
    ...projectParticipantsQuery(scope, project.id),
    enabled: setup,
  });
  const actions = useProjectBriefActions(
    scope,
    project.id,
    onSuccess,
    onUnavailable,
  );
  const error =
    brief.error ?? context.error ?? (setup ? participants.error : undefined);
  useEffect(() => {
    if (isProjectUnavailable(error)) onUnavailable(error);
  }, [error, onUnavailable]);
  if (error)
    return (
      <ProjectDetailError
        error={error}
        workspaceId={scope.workspaceId}
        pending={
          brief.isFetching || context.isFetching || participants.isFetching
        }
        retry={() => {
          void brief.refetch();
          void context.refetch();
          if (setup) void participants.refetch();
        }}
      />
    );
  if (!brief.data || !context.data || (setup && !participants.data))
    return <ProjectLoading />;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {setup ? (
        <SetupCallout
          gaps={computeReadiness(project, brief.data, participants.data ?? [])}
          workspaceId={scope.workspaceId}
          projectId={project.id}
        />
      ) : null}
      <ProductGoalCard
        brief={brief.data}
        canEdit={project.permissions.editBrief}
        actions={actions}
        people={context.data.people}
      />
      <BriefGrid
        ShareBadgeComponent={
          project.myParticipantKind === "Member"
            ? ShareBadgeComponent
            : undefined
        }
        scope={scope}
        canManageSharing={project.permissions.share}
        brief={brief.data}
        canEdit={project.permissions.editBrief}
        actions={actions}
      />
      {context.data.engagement ? (
        <EngagementSummaryCard
          context={context.data.engagement}
          workspaceId={scope.workspaceId}
        />
      ) : null}
      <ProjectFacts project={project} />
    </div>
  );
}
