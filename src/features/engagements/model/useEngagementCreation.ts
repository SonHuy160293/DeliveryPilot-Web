import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createEngagementMutation,
  engagementsKey,
  isCurrent,
  type EngagementScope,
} from "@/features/engagements/api/queries";
import type {
  CreateEngagementRequest,
  CreateEngagementResult,
} from "@/features/engagements/api/types";
import { ApiError } from "@/lib/api/apiError";

export function useEngagementCreation(scope: EngagementScope) {
  const client = useQueryClient();
  const mutation = useMutation(createEngagementMutation(scope));
  const [attempt, setAttempt] = useState<{
    request: CreateEngagementRequest;
    idempotencyKey: string;
  }>();
  const [uncertain, setUncertain] = useState(false);
  const running = useRef(false),
    active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function submit(
    request: CreateEngagementRequest,
  ): Promise<CreateEngagementResult | undefined> {
    const canDeliver = () => active.current && isCurrent(scope);
    if (running.current) return undefined;
    running.current = true;
    const intent = attempt ?? { request, idempotencyKey: crypto.randomUUID() };
    setAttempt(intent);
    try {
      const result = await mutation.mutateAsync(intent);
      if (!canDeliver()) return undefined;
      await client.invalidateQueries({
        queryKey: engagementsKey(scope),
        predicate: (query) => typeof query.queryKey.at(-1) === "object",
        refetchType: "none",
      });
      return canDeliver() ? result : undefined;
    } catch (error) {
      if (active.current) {
        if (
          error instanceof ApiError &&
          ["validation", "bad-request"].includes(error.kind)
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
