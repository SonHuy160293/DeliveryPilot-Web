import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  engagementKey,
  engagementsKey,
  engagementQuery,
  engagementWriteMutation,
  isCurrent,
  type EngagementScope,
  type EngagementWrite,
} from "@/features/engagements/api/queries";
import { ApiError } from "@/lib/api/apiError";

export function useEngagementActions(scope: EngagementScope, id: string) {
  const client = useQueryClient();
  const mutation = useMutation(engagementWriteMutation(scope, id));
  const [message, setMessage] = useState<string | null>(null);
  const active = useRef(false);
  const running = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function reload() {
    const row = await client.query({
      ...engagementQuery(scope, id),
      staleTime: 0,
    });
    if (!active.current || !isCurrent(scope))
      throw new ApiError("cancelled", "The session changed.");
    return row;
  }
  async function run(
    input: EngagementWrite,
    success: string,
  ): Promise<"done" | "keep-open"> {
    if (running.current || !current()) return "keep-open";
    running.current = true;
    try {
      const result = await mutation.mutateAsync(input);
      if (!current()) return "keep-open";
      if ("milestones" in result)
        client.setQueryData(engagementKey(scope, id), result);
      await Promise.all([
        client.invalidateQueries({
          queryKey: engagementsKey(scope),
          refetchType: "none",
        }),
        client.invalidateQueries({
          queryKey: [...engagementKey(scope, id), "history"],
        }),
        "milestones" in result
          ? Promise.resolve()
          : client.invalidateQueries({
              queryKey: engagementKey(scope, id),
              exact: true,
            }),
      ]);
      if (!current()) return "keep-open";
      setMessage(success);
      return "done";
    } finally {
      running.current = false;
    }
  }
  function current() {
    return active.current && isCurrent(scope);
  }
  return {
    run,
    reload,
    message,
    dismiss: () => {
      setMessage(null);
    },
    pending: mutation.isPending,
  };
}
export type EngagementActions = ReturnType<typeof useEngagementActions>;
