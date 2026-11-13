import { useMemo } from "react";
import { useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
import { isUuid } from "@/lib/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { WorkspaceAdmission } from "@/features/workspaces/components/WorkspaceAdmission";
import { EngagementDetailView } from "@/features/engagements/EngagementDetailView";
import { EngagementDetailError } from "@/features/engagements/components/EngagementDetailError";

export function EngagementDetailPage() {
  const { workspaceSlug, engagementId } = useParams<{
    workspaceSlug: string;
    engagementId: string;
  }>();
  const session = useAuthSession();
  const accountId =
    session.status === "authenticated" ? session.userId : undefined;
  const generation = authSession.version();
  const client = useQueryClient();
  const scope = useMemo(
    () =>
      accountId && workspaceSlug && isUuid(workspaceSlug)
        ? { accountId, generation, workspaceId: workspaceSlug }
        : undefined,
    [accountId, generation, workspaceSlug],
  );
  if (!scope || !engagementId || !isUuid(engagementId)) return <NotFoundPage />;
  return (
    <WorkspaceAdmission
      scope={scope}
      identityUnavailable={
        <EngagementDetailError
          error={
            new ApiError("server", "Identity unavailable", {
              status: 503,
              code: "Identity.Unavailable",
            })
          }
          workspaceId={scope.workspaceId}
          pending={false}
          retry={() => {
            void client.invalidateQueries({
              queryKey: ["account", scope.accountId],
            });
          }}
        />
      }
    >
      {(name) => (
        <EngagementDetailView
          key={`${String(generation)}:${scope.workspaceId}:${engagementId}`}
          scope={scope}
          engagementId={engagementId}
          workspaceName={name}
        />
      )}
    </WorkspaceAdmission>
  );
}
