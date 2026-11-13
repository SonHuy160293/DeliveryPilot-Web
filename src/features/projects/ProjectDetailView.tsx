import { useState } from "react";
import { useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { MockDataBanner } from "@/components/MockDataBanner";
import { PageHeader } from "@/components/PageHeader";
import { StatusMessage } from "@/components/StatusMessage";
import {
  projectQuery,
  projectRepositoryKind,
  type ProjectScope,
} from "@/features/projects/api/queries";
import { useProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import { projectCreationMessage } from "@/features/projects/model/projectCreationState";
import { ProjectHeader } from "@/features/projects/components/ProjectHeader";
import { ProjectTabs } from "@/features/projects/components/ProjectTabs";
import { ProjectLoading } from "@/features/projects/components/ProjectLoading";
import { ProjectDetailError } from "@/features/projects/components/ProjectDetailError";
import type { ProjectTeamComponent } from "@/features/projects/team/types";
import type { ProjectShareBadgeComponent } from "@/features/projects/brief/shareTypes";
export function ProjectDetailView({
  scope,
  projectId,
  workspaceName,
  TeamComponent,
  SharingComponent,
  ShareBadgeComponent,
}: {
  scope: ProjectScope;
  projectId: string;
  workspaceName: string;
  TeamComponent?: ProjectTeamComponent;
  SharingComponent?: ProjectTeamComponent;
  ShareBadgeComponent?: ProjectShareBadgeComponent;
}) {
  const query = useQuery(projectQuery(scope, projectId)),
    location = useLocation();
  const [message, setMessage] = useState(() =>
    projectCreationMessage(location.state, projectId),
  );
  const [unavailable, setUnavailable] = useState<unknown>();
  const error = unavailable ?? query.error;
  useProjectUnavailable(scope, projectId, error);
  const mock = projectRepositoryKind() === "mock";
  return (
    <div className="flex min-w-0 flex-col gap-6 break-words">
      {query.isPending ? (
        <ProjectLoading header />
      ) : error || !query.data ? (
        <>
          <PageHeader title="Project" />
          <ProjectDetailError
            error={error}
            workspaceId={scope.workspaceId}
            pending={query.isFetching}
            retry={() => {
              void query.refetch();
            }}
          />
        </>
      ) : (
        <>
          <ProjectHeader
            project={query.data}
            workspaceId={scope.workspaceId}
            workspaceName={workspaceName}
          />
          <StatusMessage
            message={message}
            mock={mock}
            onDismiss={() => {
              setMessage(null);
            }}
          />
          <ProjectTabs
            TeamComponent={TeamComponent}
            SharingComponent={SharingComponent}
            ShareBadgeComponent={ShareBadgeComponent}
            scope={scope}
            project={query.data}
            onSuccess={setMessage}
            onUnavailable={setUnavailable}
          />
        </>
      )}
      {mock ? <MockDataBanner /> : null}
    </div>
  );
}
