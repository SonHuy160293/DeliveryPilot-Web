import { useMemo } from "react";
import { useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
import { isUuid } from "@/lib/routes";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { WorkspaceAdmission } from "@/features/workspaces/components/WorkspaceAdmission";
import { EngagementsView } from "@/features/engagements/EngagementsView";
import { EngagementReadError } from "@/features/engagements/components/EngagementReadError";

export function EngagementsPage() {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
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
  if (!scope) return <NotFoundPage />;
  return (
    <WorkspaceAdmission
      scope={scope}
      identityUnavailable={
        <EngagementReadError
          error={
            new ApiError("server", "Identity unavailable", {
              status: 503,
              code: "Identity.Unavailable",
            })
          }
          retry={() => {
            void client.invalidateQueries({
              queryKey: ["account", scope.accountId],
            });
          }}
        />
      }
    >
      {(name) => <EngagementsView scope={scope} workspaceName={name} />}
    </WorkspaceAdmission>
  );
}
