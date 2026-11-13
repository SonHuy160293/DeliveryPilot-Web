import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  projectWriteMutation,
  projectKey,
  projectsKey,
  projectQuery,
  projectParticipantsQuery,
  projectInvitationsQuery,
  isCurrentProjectScope,
  type ProjectWrite,
  type ProjectScope,
} from "@/features/projects/api/queries";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import { ApiError } from "@/lib/api/apiError";
import { useRateLimit } from "@/lib/api/useRateLimit";
export function useProjectTeamActions(
  scope: ProjectScope,
  id: string,
  onSuccess: (message: string) => void,
  onUnavailable: (error: unknown) => void,
) {
  const client = useQueryClient(),
    mutation = useMutation(projectWriteMutation(scope, id));
  const [rateError, setRateError] = useState<unknown>();
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
    const [project, participants] = await Promise.all([
      client.query({ ...projectQuery(scope, id), staleTime: 0 }),
      client.query({ ...projectParticipantsQuery(scope, id), staleTime: 0 }),
    ]);
    if (!current()) throw new ApiError("cancelled", "The session changed.");
    const invitations = project.permissions.manageGuests
      ? await client.query({
          ...projectInvitationsQuery(scope, id),
          staleTime: 0,
        })
      : [];
    if (!current()) throw new ApiError("cancelled", "The session changed.");
    return { project, participants, invitations };
  }
  async function run(
    input: ProjectWrite,
    message: string,
  ): Promise<"done" | "keep-open"> {
    if (running.current || !current()) return "keep-open";
    running.current = true;
    try {
      await client.invalidateQueries({
        queryKey: projectKey(scope, id),
        refetchType: "none",
      });
      await mutation.mutateAsync(input);
      if (!current()) return "keep-open";
      await Promise.all([
        client.invalidateQueries({ queryKey: projectKey(scope, id) }),
        client.invalidateQueries({
          queryKey: [...projectsKey(scope), "mine"],
          refetchType: "none",
        }),
      ]);
      if (!current()) return "keep-open";
      onSuccess(message);
      return "done";
    } catch (error) {
      if (error instanceof ApiError && error.kind === "rate-limit")
        setRateError(error);
      // Action denials hide stale management controls on the next verified read.
      if (current() && isProjectUnavailable(error)) {
        try {
          await reload();
        } catch (failure) {
          if (isProjectUnavailable(failure)) onUnavailable(failure);
        }
      }
      throw error;
    } finally {
      running.current = false;
    }
  }
  async function refresh(input: ProjectWrite): Promise<ProjectWrite> {
    const result = await reload();
    if (input.action === "assignClientPo") {
      if (!result.project.permissions.assignClientPo)
        throw new ApiError("forbidden", "Action unavailable");
      return { ...input, expectedVersion: result.project.version };
    }
    if (input.action === "changeRoles" || input.action === "endParticipation") {
      const target = result.participants.find(
        (item) => item.id === input.participantId && item.status === "Active",
      );
      if (!target) throw new ApiError("not-found", "Participant unavailable");
      return input.action === "changeRoles"
        ? {
            ...input,
            request: { ...input.request, expectedVersion: target.version },
          }
        : {
            ...input,
            request: { ...input.request, expectedVersion: target.version },
          };
    }
    if (
      input.action === "resendInvitation" ||
      input.action === "cancelInvitation"
    ) {
      const target = result.invitations.find(
        (item) => item.id === input.invitationId && item.status === "Pending",
      );
      if (!target) throw new ApiError("not-found", "Invitation unavailable");
      return { ...input, expectedVersion: target.version };
    }
    return input;
  }
  const rate = useRateLimit(rateError);
  return {
    run,
    reload,
    refresh,
    pending: mutation.isPending,
    blocked: rate.blocked,
    reset: mutation.reset,
  };
}
export type ProjectTeamActions = ReturnType<typeof useProjectTeamActions>;
