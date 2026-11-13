import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateProjectBriefMutation,
  projectKey,
  projectsKey,
  projectQuery,
  projectBriefQuery,
  isCurrentProjectScope,
  type ProjectScope,
} from "@/features/projects/api/queries";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import type { UpdateBriefItemRequest } from "@/features/projects/api/types";
import { ApiError } from "@/lib/api/apiError";
export function useProjectBriefActions(
  scope: ProjectScope,
  id: string,
  onSuccess: (message: string) => void,
  onUnavailable: (error: unknown) => void,
) {
  const client = useQueryClient(),
    mutation = useMutation(updateProjectBriefMutation(scope, id));
  const active = useRef(false),
    running = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const current = () => active.current && isCurrentProjectScope(scope);
  async function reload() {
    try {
      const [project, brief] = await Promise.all([
        client.query({ ...projectQuery(scope, id), staleTime: 0 }),
        client.query({ ...projectBriefQuery(scope, id), staleTime: 0 }),
      ]);
      if (!current()) throw new ApiError("cancelled", "The session changed.");
      return { brief, canEdit: project.permissions.editBrief };
    } catch (error) {
      if (current() && isProjectUnavailable(error)) onUnavailable(error);
      throw error;
    }
  }
  async function save(
    request: UpdateBriefItemRequest,
  ): Promise<"done" | "keep-open"> {
    if (running.current || !current()) return "keep-open";
    running.current = true;
    try {
      // A late or uncertain result must be re-read on the next overview mount.
      await client.invalidateQueries({
        queryKey: [...projectKey(scope, id), "brief"],
        exact: true,
        refetchType: "none",
      });
      const brief = await mutation.mutateAsync(request);
      if (!current()) return "keep-open";
      client.setQueryData([...projectKey(scope, id), "brief"], brief);
      await Promise.all([
        client.invalidateQueries({
          queryKey: [...projectKey(scope, id), "detail"],
          exact: true,
        }),
        client.invalidateQueries({
          queryKey: [...projectsKey(scope), "mine"],
          refetchType: "none",
        }),
        client.invalidateQueries({
          queryKey: [...projectKey(scope, id), "history"],
          refetchType: "none",
        }),
      ]);
      if (!current()) return "keep-open";
      onSuccess(
        request.item === "ProductGoal"
          ? "Product Goal updated."
          : "Brief updated.",
      );
      return "done";
    } catch (error) {
      if (current() && isProjectUnavailable(error)) onUnavailable(error);
      throw error;
    } finally {
      running.current = false;
    }
  }
  return { reload, save };
}
export type ProjectBriefActions = ReturnType<typeof useProjectBriefActions>;
