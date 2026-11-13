import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { workspaceProjectsPath } from "@/lib/routes";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { EngagementStatusDialog } from "@/features/engagements/components/EngagementStatusDialog";

export function EngagementHeaderActions({
  engagement,
  workspaceId,
  canManage,
  canCreateProject,
  actions,
}: {
  engagement: EngagementDetail;
  workspaceId: string;
  canManage: boolean;
  canCreateProject: boolean;
  actions: EngagementActions;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {engagement.status === "Active" && canCreateProject ? (
        <Button variant="outline" asChild>
          <Link
            to={`${workspaceProjectsPath(workspaceId)}?${new URLSearchParams({ create: "1", engagementId: engagement.id })}`}
          >
            Create project
          </Link>
        </Button>
      ) : null}
      {canManage ? (
        <EngagementStatusDialog engagement={engagement} actions={actions} />
      ) : null}
    </div>
  );
}
