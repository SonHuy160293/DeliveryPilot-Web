import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import type { InvitationPreview } from "@/features/workspaces/api/contracts";
import {
  discoveryKey,
  personalNominationsKey,
  resourceKey,
} from "@/features/workspaces/api/queries";
import { isOwner, type SessionOwner } from "@/features/workspaces/api/request";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { recipientApi } from "@/features/workspaces/recipient/recipientApi";
import { useInvitationFlow } from "@/features/workspaces/recipient/invitationContext";
import { ApiError } from "@/lib/api/apiError";
import { workspaceOverviewPath } from "@/lib/routes";

export function useRecipientResponse(owner: SessionOwner) {
  const flow = useInvitationFlow();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitationPreview>();
  const [error, setError] = useState<unknown>();
  const [pending, setPending] = useState(false);
  const [outcome, setOutcome] = useState<"accepted" | "declined">();
  const [uncertain, setUncertain] = useState(false);
  const controller = useRef<AbortController | undefined>(undefined);
  const live = useRef(true);
  useEffect(() => {
    live.current = true;
    return () => {
      live.current = false;
      controller.current?.abort();
    };
  }, []);
  async function run(kind: "preview" | "accept" | "decline"): Promise<boolean> {
    if (controller.current || !isOwner(owner)) return false;
    const secret = flow.bind(owner);
    if (!secret || (kind !== "preview" && !preview)) return false;
    const active = new AbortController();
    controller.current = active;
    setPending(true);
    setError(undefined);
    const current = () =>
      live.current && !active.signal.aborted && isOwner(owner);
    let accepted = false;
    try {
      if (kind === "preview") {
        const result = await recipientApi.preview(owner, secret, active.signal);
        if (current()) {
          setPreview(result);
          setUncertain(false);
        }
      } else if (kind === "accept" && preview) {
        const result = await recipientApi.accept(
          owner,
          secret,
          preview.version,
          active.signal,
        );
        if (!current()) return false;
        accepted = true;
        setOutcome("accepted");
        const scope = { ...owner, workspaceId: result.organizationId };
        await Promise.all(
          [
            discoveryKey(owner.accountId),
            personalNominationsKey(owner.accountId),
            ...["membership", "members", "roles", "audit", "invitations"].map(
              (resource) => resourceKey(scope, resource),
            ),
          ].map((queryKey) => client.invalidateQueries({ queryKey })),
        );
        if (!current()) return false;
        await workspaceApi.me(owner, result.organizationId, active.signal);
        if (current()) {
          flow.clear();
          void navigate(workspaceOverviewPath(result.organizationId), {
            replace: true,
          });
        }
      } else if (kind === "decline" && preview) {
        await recipientApi.decline(
          owner,
          secret,
          preview.version,
          active.signal,
        );
        if (current()) {
          flow.clear();
          setPreview(undefined);
          setOutcome("declined");
        }
      }
      return current();
    } catch (failure) {
      if (
        !current() ||
        (failure instanceof ApiError && failure.kind === "cancelled")
      )
        return false;
      setError(failure);
      if (
        accepted ||
        (failure instanceof ApiError && failure.kind === "forbidden")
      ) {
        flow.clear();
        setPreview(undefined);
      } else if (kind !== "preview") setUncertain(true);
      return false;
    } finally {
      if (current()) setPending(false);
      if (controller.current === active) controller.current = undefined;
    }
  }
  return {
    preview,
    error,
    pending,
    outcome,
    uncertain,
    run,
    available: Boolean(flow.get()),
    abandon: () => {
      controller.current?.abort();
      flow.clear();
      setPreview(undefined);
      setPending(false);
    },
  };
}
