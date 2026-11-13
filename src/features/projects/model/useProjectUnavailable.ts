import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/apiError";
import {
  projectKey,
  projectsKey,
  type ProjectScope,
} from "@/features/projects/api/queries";
import type { ProjectListItem } from "@/features/projects/api/types";
export function isProjectUnavailable(error: unknown) {
  return (
    error instanceof ApiError && ["not-found", "forbidden"].includes(error.kind)
  );
}
export function useProjectUnavailable(
  scope: ProjectScope,
  id: string,
  error: unknown,
) {
  const client = useQueryClient();
  const { accountId, workspaceId } = scope;
  useEffect(() => {
    if (!isProjectUnavailable(error)) return;
    const key = projectKey({ accountId, workspaceId }, id);
    const mine = [...projectsKey({ accountId, workspaceId }), "mine"];
    client.setQueryData<ProjectListItem[]>(mine, (rows) =>
      rows?.filter((row) => row.id !== id),
    );
    void client.invalidateQueries({
      queryKey: mine,
      exact: true,
      refetchType: "none",
    });
    void client.cancelQueries({ queryKey: key }, { revert: false }).then(() => {
      for (const query of client.getQueryCache().findAll({ queryKey: key })) {
        if (!query.getObserversCount()) client.getQueryCache().remove(query);
        else if (query.state.data !== undefined)
          query.setState({ data: undefined, error, status: "error" });
      }
    });
  }, [client, accountId, workspaceId, id, error]);
}
