import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiFeedback } from "@/components/ApiFeedback";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  projectBriefQuery,
  projectParticipantsQuery,
  projectSettingsContextQuery,
} from "@/features/projects/api/queries";
import type { ProjectTeamProps } from "@/features/projects/team/types";
import { useProjectSettingsActions } from "@/features/projects/model/useProjectSettingsActions";
import { computeReadiness } from "@/features/projects/model/readiness";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import { CadenceCard } from "@/features/projects/settings/CadenceCard";
import { EngagementCard } from "@/features/projects/settings/EngagementCard";
import { ActivationCard } from "@/features/projects/settings/ActivationCard";
import { ProjectHistory } from "@/features/projects/settings/ProjectHistory";
export function ProjectSettingsTab({
  scope,
  project,
  onSuccess,
  onUnavailable,
}: ProjectTeamProps) {
  const draft = project.status === "Draft";
  const brief = useQuery({
      ...projectBriefQuery(scope, project.id),
      enabled: draft,
    }),
    participants = useQuery({
      ...projectParticipantsQuery(scope, project.id),
      enabled: draft,
    }),
    context = useQuery({
      ...projectSettingsContextQuery(scope, project.id),
      enabled: !draft,
    });
  const actions = useProjectSettingsActions(
    scope,
    project.id,
    onSuccess,
    onUnavailable,
  );
  const error = draft ? (brief.error ?? participants.error) : context.error;
  useEffect(() => {
    if (isProjectUnavailable(error)) onUnavailable(error);
  }, [error, onUnavailable]);
  const loading = draft ? !brief.data || !participants.data : !context.data;
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <CadenceCard project={project} actions={actions} />
      <EngagementCard scope={scope} project={project} actions={actions} />
      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Activation</h3>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ApiFeedback error={error} />
            <Button
              variant="outline"
              onClick={() => {
                if (draft) {
                  void brief.refetch();
                  void participants.refetch();
                } else void context.refetch();
              }}
            >
              Retry loading activation
            </Button>
          </CardContent>
        </Card>
      ) : loading ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h3>Activation</h3>
            </CardTitle>
          </CardHeader>
          <CardContent
            role="status"
            aria-busy="true"
            className="flex flex-col gap-3"
          >
            <span className="sr-only">Loading activation</span>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      ) : (
        <ActivationCard
          project={project}
          workspaceId={scope.workspaceId}
          gaps={
            brief.data && participants.data
              ? computeReadiness(project, brief.data, participants.data)
              : []
          }
          people={context.data?.people ?? {}}
          actions={actions}
        />
      )}
      {project.permissions.readHistory ? (
        <ProjectHistory scope={scope} projectId={project.id} />
      ) : null}
    </div>
  );
}
