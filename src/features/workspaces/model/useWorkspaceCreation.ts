import { useState } from "react";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { useWorkspaceMutation } from "@/features/workspaces/model/useWorkspaceMutation";
import { ApiError } from "@/lib/api/apiError";

export function useWorkspaceCreation(owner: SessionOwner) {
  const [attempt, setAttempt] = useState<{ attemptId: string; name: string }>();
  const [hadUncertainty, setHadUncertainty] = useState(false);
  const create = useWorkspaceMutation(
    owner,
    "creation",
    (input: { attemptId: string; name: string }, signal) =>
      workspaceApi.create(owner, input, signal),
  );
  const uncertain =
    !create.isSuccess &&
    (hadUncertainty ||
      (Boolean(create.error) &&
        (!(create.error instanceof ApiError) ||
          [
            "timeout",
            "network",
            "protocol",
            "server",
            "cancelled",
            "forbidden",
            "unauthenticated",
            "http",
            "application",
          ].includes(create.error.kind))));
  const expired =
    create.error instanceof ApiError &&
    [
      "Organization.CreationAttemptExpired",
      "Organization.CreationAttemptConflict",
    ].includes(create.error.details.code ?? "");
  function submit(values: { name: string }) {
    if (uncertain) setHadUncertainty(true);
    const intent = attempt ?? {
      attemptId: crypto.randomUUID(),
      name: values.name,
    };
    setAttempt(intent);
    void create.run(intent);
  }
  function clear() {
    setAttempt(undefined);
    setHadUncertainty(false);
    create.reset();
  }
  return { create, attempt, uncertain, expired, submit, clear };
}
