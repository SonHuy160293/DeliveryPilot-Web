import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  projectWriteMutation,
  projectKey,
  projectQuery,
  projectStakeholdersQuery,
  isCurrentProjectScope,
  type ProjectScope,
  type ProjectWrite,
} from "@/features/projects/api/queries";
import { ApiError } from "@/lib/api/apiError";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
export function useStakeholderActions(
  scope: ProjectScope,
  id: string,
  onSuccess: (message: string) => void,
  onUnavailable: (error: unknown) => void,
) {
  const client = useQueryClient(),
    mutation = useMutation(projectWriteMutation(scope, id)),
    live = useRef(false),
    running = useRef(false);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
    };
  }, []);
  const current = () => live.current && isCurrentProjectScope(scope);
  async function run(
    input: ProjectWrite,
    message: string,
  ): Promise<"done" | "keep-open"> {
    if (!current() || running.current) return "keep-open";
    running.current = true;
    try {
      await mutation.mutateAsync(input);
      if (!current()) return "keep-open";
      await client.invalidateQueries({ queryKey: projectKey(scope, id) });
      if (!current()) return "keep-open";
      onSuccess(message);
      return "done";
    } catch (error) {
      if (current() && error instanceof ApiError && error.kind === "conflict")
        await client.invalidateQueries({ queryKey: projectKey(scope, id) });
      if (current() && isProjectUnavailable(error)) onUnavailable(error);
      throw error;
    } finally {
      running.current = false;
    }
  }
  async function reload() {
    const project = await client.query({
      ...projectQuery(scope, id),
      staleTime: 0,
    });
    if (!current()) throw new ApiError("cancelled", "The session changed.");
    if (!project.permissions.editStakeholders)
      throw new ApiError("forbidden", "Action unavailable");
    return client.query({
      ...projectStakeholdersQuery(scope, id, true),
      staleTime: 0,
    });
  }
  return { run, reload, pending: mutation.isPending };
}
export type StakeholderActions = ReturnType<typeof useStakeholderActions>;
