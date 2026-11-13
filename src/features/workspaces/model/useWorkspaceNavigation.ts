import { useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { Member } from "@/features/workspaces/api/contracts";
import {
  rolesOptions,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { useDeniedCleanup } from "@/lib/query/useDeniedCleanup";
import type { WorkspaceNavigation } from "@/lib/workspaceNavigation";

const engagementCodes = new Set([
  "organization.engagements.create",
  "organization.engagements.read-all",
  "organization.engagements.manage",
]);

export function useWorkspaceNavigation(
  scope: ScopedOwner,
  me?: Member,
): WorkspaceNavigation {
  const options = rolesOptions(scope);
  const roles = useInfiniteQuery({
    ...options,
    enabled: me?.status === "active",
  });
  useDeniedCleanup(roles.error, options.queryKey);
  const { hasNextPage, isFetching, error, fetchNextPage } = roles;
  useEffect(() => {
    if (me?.status === "active" && hasNextPage && !isFetching && !error)
      void fetchNextPage({ cancelRefetch: false });
  }, [me?.status, hasNextPage, isFetching, error, fetchNextPage]);
  const current = me?.status === "active" ? me.roles : [];
  const owner = current.some((role) => role.code === "owner");
  const admin = current.some((role) => role.code === "admin");
  const heldIds = new Set(current.map((role) => role.id));
  const engagements =
    !roles.error &&
    roles.isSuccess &&
    roles.data.pages.some((page) =>
      page.items.some(
        (role) =>
          heldIds.has(role.id) &&
          role.retiredAt === null &&
          role.permissionCodes.some((code) => engagementCodes.has(code)),
      ),
    );
  return {
    workspaceId: scope.workspaceId,
    engagements,
    clientLinks: owner || admin,
    projectRecovery: owner,
  };
}
