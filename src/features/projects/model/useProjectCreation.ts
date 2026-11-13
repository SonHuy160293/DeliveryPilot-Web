import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProjectMutation,
  projectsKey,
  isCurrentProjectScope,
  type ProjectScope,
} from "@/features/projects/api/queries";
import type {
  CreateProjectRequest,
  ProjectDetail,
} from "@/features/projects/api/types";
import { ApiError } from "@/lib/api/apiError";
export function useProjectCreation(scope: ProjectScope) {
  const client = useQueryClient(),
    mutation = useMutation(createProjectMutation(scope));
  const [attempt, setAttempt] = useState<{
    request: CreateProjectRequest;
    idempotencyKey: string;
  }>();
  const [uncertain, setUncertain] = useState(false);
  const active = useRef(false),
    running = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function submit(
    request: CreateProjectRequest,
  ): Promise<ProjectDetail | undefined> {
    const current = () => active.current && isCurrentProjectScope(scope);
    if (running.current || !current()) return undefined;
    const intent = attempt ?? { request, idempotencyKey: crypto.randomUUID() };
    setAttempt(intent);
    running.current = true;
    try {
      const result = await mutation.mutateAsync(intent);
      if (!current()) return undefined;
      await client.invalidateQueries({
        queryKey: [...projectsKey(scope), "mine"],
        refetchType: "none",
      });
      return current() ? result : undefined;
    } catch (error) {
      if (current()) {
        if (
          error instanceof ApiError &&
          ["validation", "bad-request", "not-found"].includes(error.kind)
        ) {
          setAttempt(undefined);
          setUncertain(false);
        } else setUncertain(true);
      }
      throw error;
    } finally {
      running.current = false;
    }
  }
  return { submit, attempt, uncertain };
}
