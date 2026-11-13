import { useParams } from "react-router";
import { useMemo, lazy, Suspense } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
import { isUuid } from "@/lib/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { WorkspaceAdmission } from "@/features/workspaces/components/WorkspaceAdmission";
import { ProjectsReadError } from "@/features/projects/components/ProjectsReadError";
import { ProjectLoading } from "@/features/projects/components/ProjectLoading";
import { ShareBadge } from "@/features/sharing/ShareBadge";
const ProjectSharingTab = lazy(() =>
  import("@/pages/ProjectSharingPanel").then((module) => ({
    default: module.ProjectSharingPanel,
  })),
);
const ProjectTeamPanel = lazy(() =>
  import("@/pages/ProjectTeamPanel").then((module) => ({
    default: module.ProjectTeamPanel,
  })),
);
const ProjectDetailView = lazy(() =>
  import("@/features/projects/ProjectDetailView").then((module) => ({
    default: module.ProjectDetailView,
  })),
);
export function ProjectDetailPage() {
  const { workspaceSlug, projectId } = useParams<{
    workspaceSlug: string;
    projectId: string;
  }>();
  const session = useAuthSession(),
    generation = authSession.version(),
    client = useQueryClient();
  const accountId =
    session.status === "authenticated" ? session.userId : undefined;
  const scope = useMemo(
    () =>
      accountId && workspaceSlug && isUuid(workspaceSlug)
        ? { accountId, generation, workspaceId: workspaceSlug }
        : undefined,
    [accountId, generation, workspaceSlug],
  );
  if (!scope || !projectId || !isUuid(projectId)) return <NotFoundPage />;
  return (
    <WorkspaceAdmission
      scope={scope}
      identityUnavailable={
        <ProjectsReadError
          error={
            new ApiError("server", "Identity unavailable", { status: 503 })
          }
          retry={() => {
            void client.invalidateQueries({
              queryKey: ["account", scope.accountId],
            });
          }}
        />
      }
    >
      {(name) => (
        <Suspense fallback={<ProjectLoading header />}>
          <ProjectDetailView
            TeamComponent={ProjectTeamPanel}
            SharingComponent={ProjectSharingTab}
            ShareBadgeComponent={ShareBadge}
            key={scope.workspaceId + ":" + String(generation) + ":" + projectId}
            scope={scope}
            projectId={projectId}
            workspaceName={name}
          />
        </Suspense>
      )}
    </WorkspaceAdmission>
  );
}
