import { useMemo, lazy, Suspense } from "react";
import { useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
import { isUuid } from "@/lib/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { WorkspaceAdmission } from "@/features/workspaces/components/WorkspaceAdmission";
import { ProjectGrid } from "@/features/projects/components/ProjectGrid";
import { ProjectsReadError } from "@/features/projects/components/ProjectsReadError";
const ProjectsView = lazy(() =>
  import("@/features/projects/ProjectsView").then((module) => ({
    default: module.ProjectsView,
  })),
);

export function ProjectsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
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
  if (!scope) return <NotFoundPage />;
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
        <Suspense
          fallback={
            <ProjectGrid
              projects={[]}
              workspaceId={scope.workspaceId}
              loading
            />
          }
        >
          <ProjectsView
            key={`${scope.workspaceId}:${String(generation)}`}
            scope={scope}
            workspaceName={name}
          />
        </Suspense>
      )}
    </WorkspaceAdmission>
  );
}
