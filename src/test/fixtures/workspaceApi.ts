import { mutationOptions, queryOptions } from "@tanstack/react-query";
import type { AxiosInstance } from "axios";
import { workspaceScopeKey, type WorkspaceScope } from "@/lib/query/queryScope";
import type { WorkspaceSummary } from "@/mocks/workspaces";

/** TEST-ONLY transport contract. These endpoints do not exist in the production backend. */
export function fixtureWorkspaceApi(
  client: AxiosInstance,
  scope: WorkspaceScope,
) {
  const root = [...workspaceScopeKey(scope), "fixture-workspaces"] as const;
  const path = `__fixtures/accounts/${encodeURIComponent(scope.accountId)}/workspaces/${encodeURIComponent(scope.workspaceId)}/records`;
  const keys = {
    all: root,
    lists: () => [...root, "list"] as const,
    list: (search: string) =>
      [...root, "list", { search, sort: "name" }] as const,
    detail: (id: string) => [...root, "detail", id] as const,
  };
  return {
    keys,
    list: (search = "") =>
      queryOptions({
        queryKey: keys.list(search),
        queryFn: async ({ signal }) =>
          (
            await client.get<WorkspaceSummary[]>(path, {
              params: { search, sort: "name" },
              signal,
            })
          ).data,
      }),
    detail: (id: string) =>
      queryOptions({
        queryKey: keys.detail(id),
        queryFn: async ({ signal }) =>
          (
            await client.get<WorkspaceSummary>(
              `${path}/${encodeURIComponent(id)}`,
              { signal },
            )
          ).data,
      }),
    create: () =>
      mutationOptions({
        mutationKey: [...root, "create"],
        mutationFn: async (input: { name: string; slug: string }) =>
          (await client.post<WorkspaceSummary>(path, input)).data,
        retry: false,
      }),
  };
}
