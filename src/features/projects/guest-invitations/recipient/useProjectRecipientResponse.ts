import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { useProjectInvitationFlow } from "@/features/projects/guest-invitations/recipient/invitationContext";
import {
  projectRecipientApi,
  projectInvitationRepositoryKind,
} from "@/features/projects/guest-invitations/recipient/queries";
import {
  ProjectInvitationError,
  type ProjectInvitationProblem,
} from "@/features/projects/guest-invitations/recipient/recipientErrors";
import {
  isRecipientOwner,
  type ProjectRecipientOwner,
} from "@/features/projects/guest-invitations/recipient/owner";
import type { ProjectInvitationPreviewResult } from "@/features/projects/guest-invitations/recipient/types";
import { ApiError } from "@/lib/api/apiError";
import { portalProjectPath, ROUTES } from "@/lib/routes";
import { authSession } from "@/lib/api/authSession";
import { clearSessionCache } from "@/lib/query/queryScope";
type Action = "preview" | "accept" | "decline";
export function useProjectRecipientResponse({
  accountId,
  generation,
}: ProjectRecipientOwner) {
  const flow = useProjectInvitationFlow(),
    client = useQueryClient(),
    navigate = useNavigate();
  const [result, setResult] = useState<ProjectInvitationPreviewResult>(),
    [problem, setProblem] = useState<ProjectInvitationProblem>(),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false),
    [declined, setDeclined] = useState(false);
  const controller = useRef<AbortController | undefined>(undefined),
    live = useRef(false),
    preview = useRef<ProjectInvitationPreviewResult | undefined>(undefined),
    lastAction = useRef<Action>("preview");
  const run = useCallback(
    async (kind: Action): Promise<void> => {
      const owner = { accountId, generation };
      if (controller.current || !isRecipientOwner(owner)) return;
      const secret = flow.bind(owner);
      if (!secret) {
        setProblem("unavailable");
        return;
      }
      const ready = preview.current;
      if (kind !== "preview" && ready?.kind !== "preview") return;
      const active = new AbortController();
      controller.current = active;
      lastAction.current = kind;
      const current = () =>
        live.current && !active.signal.aborted && isRecipientOwner(owner);
      setPending(true);
      setError(undefined);
      try {
        if (kind === "preview") {
          const response = await projectRecipientApi.preview(
            owner,
            secret,
            active.signal,
          );
          if (current()) {
            preview.current = response;
            setResult(response);
            if (response.kind === "already-guest") flow.clear();
          }
        } else if (ready?.kind === "preview" && kind === "accept") {
          const response = await projectRecipientApi.accept(
            owner,
            secret,
            ready.preview.version,
            active.signal,
          );
          if (!current()) return;
          flow.clear();
          await client.invalidateQueries({
            queryKey: ["account", accountId, "portal"],
            refetchType: "none",
          });
          if (current())
            await navigate(portalProjectPath(response.projectId), {
              replace: true,
              state: {
                projectGuestJoined: true,
                projectId: response.projectId,
                projectName: ready.preview.projectName,
                mock: projectInvitationRepositoryKind() === "mock",
              },
            });
        } else if (ready?.kind === "preview" && kind === "decline") {
          await projectRecipientApi.decline(
            owner,
            secret,
            ready.preview.version,
            active.signal,
          );
          if (current()) {
            flow.clear();
            preview.current = undefined;
            setResult(undefined);
            setDeclined(true);
          }
        }
      } catch (failure) {
        if (
          !current() ||
          (failure instanceof ApiError && failure.kind === "cancelled")
        )
          return;
        if (
          failure instanceof ProjectInvitationError ||
          (failure instanceof ApiError &&
            [
              "forbidden",
              "not-found",
              "conflict",
              "bad-request",
              "validation",
            ].includes(failure.kind))
        ) {
          flow.clear();
          preview.current = undefined;
          setResult(undefined);
          setProblem(
            failure instanceof ProjectInvitationError
              ? failure.problem
              : "unavailable",
          );
        } else setError(failure);
      } finally {
        if (current()) setPending(false);
        if (controller.current === active) controller.current = undefined;
      }
    },
    [accountId, generation, flow, client, navigate],
  );
  useEffect(() => {
    live.current = true;
    void run("preview");
    return () => {
      live.current = false;
      controller.current?.abort();
      controller.current = undefined;
    };
  }, [run]);
  function signOut() {
    flow.clear();
    controller.current?.abort();
    authSession.clear(true);
    void clearSessionCache(client);
    void navigate(ROUTES.signIn, {
      replace: true,
      state: { localSignOut: true },
    });
  }
  return {
    result,
    problem,
    error,
    pending,
    declined,
    run,
    retry: () => run(lastAction.current),
    signOut,
  };
}
