import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { sharesQuery, type SharingScope } from "@/features/sharing/api/queries";
import type { BriefItemCode } from "@/features/projects/api/types";
import { workspaceProjectPath } from "@/lib/routes";
import { SHARE_BRIEF_ITEMS } from "@/features/sharing/model/items";
export interface ShareBadgeProps {
  scope: SharingScope;
  projectId: string;
  canManage: boolean;
  label?: string;
  item: { briefItemCode?: BriefItemCode; stakeholderId?: string };
}
export function ShareBadge({
  scope,
  projectId,
  canManage,
  item,
  label,
}: ShareBadgeProps) {
  const query = useQuery(sharesQuery(scope, projectId));
  if (query.isPending)
    return (
      <span role="status" className="text-sm text-muted-foreground">
        Checking sharing…
      </span>
    );
  if (query.error)
    return (
      <span className="text-sm text-muted-foreground">Sharing unavailable</span>
    );
  const shared = query.data?.some(
    (row) =>
      row.status === "Shared" &&
      (item.briefItemCode
        ? row.itemType === "BriefItem" &&
          row.briefItemCode === item.briefItemCode
        : row.itemType === "Stakeholder" &&
          row.stakeholderId === item.stakeholderId),
  );
  const badge = (
    <Badge variant="outline">{shared ? "Shared" : "Internal"}</Badge>
  );
  return canManage ? (
    <Link
      aria-label={`Manage sharing for ${label ?? SHARE_BRIEF_ITEMS.find((row) => row.code === item.briefItemCode)?.label ?? "stakeholder"}`}
      to={workspaceProjectPath(scope.workspaceId, projectId, "sharing")}
      className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {badge}
    </Link>
  ) : (
    badge
  );
}
