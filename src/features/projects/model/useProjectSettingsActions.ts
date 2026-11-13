import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  projectSettingsMutation,
  projectKey,
  projectsKey,
  projectQuery,
  projectBriefQuery,
  projectParticipantsQuery,
  isCurrentProjectScope,
  type ProjectSettingsWrite,
  type ProjectScope,
} from "@/features/projects/api/queries";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import { ApiError } from "@/lib/api/apiError";
export function useProjectSettingsActions(
  scope: ProjectScope,
  id: string,
  onSuccess: (message: string) => void,
  onUnavailable: (error: unknown) => void,
) {
  const client = useQueryClient(),
    mutation = useMutation(projectSettingsMutation(scope, id));
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
      const [project, brief, participants] = await Promise.all([
        client.query({ ...projectQuery(scope, id), staleTime: 0 }),
        client.query({ ...projectBriefQuery(scope, id), staleTime: 0 }),
        client.query({ ...projectParticipantsQuery(scope, id), staleTime: 0 }),
      ]);
      if (!current()) throw new ApiError("cancelled", "The session changed.");
      return { project, brief, participants };
    } catch (error) {
      if (current() && isProjectUnavailable(error)) onUnavailable(error);
      throw error;
    }
  }
  async function run(
    input: ProjectSettingsWrite,
  ): Promise<"done" | "keep-open"> {
    if (running.current || !current()) return "keep-open";
    running.current = true;
    try {
      await client.invalidateQueries({
        queryKey: projectKey(scope, id),
        refetchType: "none",
      });
      const result = await mutation.mutateAsync(input);
      if (!current()) return "keep-open";
      client.setQueryData(projectQuery(scope, id).queryKey, result.project);
      await Promise.all([
        client.invalidateQueries({ queryKey: projectKey(scope, id) }),
        client.invalidateQueries({
          queryKey: [...projectsKey(scope), "mine"],
          refetchType: "none",
        }),
        client.invalidateQueries({
          queryKey: ["account", scope.accountId, "portal"],
          refetchType: "none",
        }),
      ]);
      if (!current()) return "keep-open";
      const message =
        input.action === "activate"
          ? "Project activated."
          : input.action === "setSprintLength"
            ? `Sprint length set to ${String(input.weeks)} weeks.`
            : `Engagement changed.${result.engagementSummaryWithdrawn ? "\nThe engagement summary is no longer shared with guests." : ""}`;
      onSuccess(message);
      return "done";
    } catch (error) {
      if (current() && isProjectUnavailable(error)) {
        try {
          await reload();
        } catch {
          /* Admission loss is reported by reload. */
        }
      }
      throw error;
    } finally {
      running.current = false;
    }
  }
  return { run, reload };
}
export type ProjectSettingsActions = ReturnType<
  typeof useProjectSettingsActions
>;
