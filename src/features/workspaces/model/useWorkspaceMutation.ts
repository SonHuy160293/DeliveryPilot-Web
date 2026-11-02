import { useEffect, useRef } from "react";
import {
  mutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  assertOwner,
  isOwner,
  type SessionOwner,
} from "@/features/workspaces/api/request";
import {
  discoveryKey,
  personalNominationsKey,
  resourceKey,
} from "@/features/workspaces/api/queries";
import { authSession } from "@/lib/api/authSession";
import { ApiError } from "@/lib/api/apiError";
import type { WorkspaceScope } from "@/lib/query/queryScope";
import { workspaceScopeKey } from "@/lib/query/queryScope";

export type ChangeKind =
  "creation" | "roles" | "members" | "invitations" | "ownership";
const affected = {
  creation: [],
  roles: [
    "roles",
    "permissions",
    "members",
    "membership",
    "invitations",
    "audit",
  ],
  members: ["members", "membership", "nominations", "invitations", "audit"],
  invitations: ["invitations", "audit"],
  ownership: ["nominations", "members", "membership", "roles", "audit"],
} satisfies Record<ChangeKind, string[]>;

export function workspaceMutationOptions<T, R>(
  owner: SessionOwner & Partial<WorkspaceScope>,
  kind: ChangeKind,
  operation: (input: T) => Promise<R>,
) {
  return mutationOptions({
    mutationKey: [
      ...(owner.workspaceId
        ? workspaceScopeKey({
            accountId: owner.accountId,
            workspaceId: owner.workspaceId,
          })
        : discoveryKey(owner.accountId)),
      "write",
      kind,
    ],
    retry: false,
    mutationFn: async (input: T) => {
      assertOwner(owner);
      return operation(input);
    },
  });
}

/** Only nonsecret writes use this hook. Proof-bearing calls never enter its cache. */
export function useWorkspaceMutation<T, R>(
  owner: SessionOwner & Partial<WorkspaceScope>,
  kind: ChangeKind,
  operation: (input: T, signal: AbortSignal) => Promise<R>,
) {
  const client = useQueryClient();
  const active = useRef(true);
  const controllers = useRef(new Set<AbortController>());
  useEffect(() => {
    active.current = true;
    const retire = () => {
      for (const controller of controllers.current) controller.abort();
    };
    const unsubscribe = authSession.subscribe(() => {
      if (!isOwner(owner)) retire();
    });
    const pending = controllers.current;
    return () => {
      active.current = false;
      unsubscribe();
      for (const controller of pending) controller.abort();
    };
  }, [owner.accountId, owner.generation]);
  const mutation = useMutation({
    ...workspaceMutationOptions(owner, kind, async (input: T) => {
      const controller = new AbortController();
      controllers.current.add(controller);
      try {
        return await operation(input, controller.signal);
      } finally {
        controllers.current.delete(controller);
      }
    }),
    onSuccess: async () => {
      if (!active.current || !isOwner(owner)) return;
      const keys: readonly (readonly unknown[])[] = [
        ...(kind !== "invitations"
          ? [
              discoveryKey(owner.accountId),
              personalNominationsKey(owner.accountId),
            ]
          : []),
        ...(owner.workspaceId
          ? affected[kind].map((resource) =>
              resourceKey(
                {
                  accountId: owner.accountId,
                  workspaceId: owner.workspaceId ?? "",
                },
                resource,
              ),
            )
          : []),
      ];
      await Promise.all(
        keys.map((queryKey) => client.invalidateQueries({ queryKey })),
      );
    },
  });
  async function run(input: T): Promise<R | undefined> {
    try {
      const result = await mutation.mutateAsync(input);
      return active.current && isOwner(owner) ? result : undefined;
    } catch (error) {
      if (error instanceof ApiError && error.kind === "cancelled")
        return undefined;
      return undefined;
    }
  }
  return { ...mutation, run };
}
