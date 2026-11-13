import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { uuid } from "@/features/workspaces/api/contracts";
import { WorkspaceAdmission } from "@/features/workspaces/components/WorkspaceAdmission";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { ROUTES } from "@/lib/routes";
import type { WorkspaceExtraPanels } from "@/features/workspaces/components/workspaceExtraPanels";

export function WorkspaceLanding({
  owner,
  extraPanels,
}: {
  owner: SessionOwner;
  extraPanels?: WorkspaceExtraPanels;
}) {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const parsed = uuid.safeParse(workspaceSlug);
  const workspaceId = parsed.success ? parsed.data : undefined;
  const { accountId, generation } = owner;
  const scope = useMemo(
    () => (workspaceId ? { accountId, generation, workspaceId } : undefined),
    [accountId, generation, workspaceId],
  );
  if (!scope)
    return (
      <EmptyState
        title="Choose a workspace"
        description="This address does not contain a valid workspace identifier."
        action={
          <Button asChild variant="outline">
            <Link to={ROUTES.workspaces}>Back to workspaces</Link>
          </Button>
        }
      />
    );
  return <WorkspaceAdmission scope={scope} extraPanels={extraPanels} />;
}
