import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  permissionsOptions,
  rolesOptions,
  resourceKey,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { useWorkspaceMutation } from "@/features/workspaces/model/useWorkspaceMutation";
import {
  ReadState,
  LoadMore,
} from "@/features/workspaces/components/ReadState";
import { RefreshButton } from "@/features/workspaces/components/ApiFeedback";
import { ConfirmAction } from "@/features/workspaces/components/ConfirmAction";
import { RoleForm } from "@/features/workspaces/roles/RoleForm";

export default function RolesPanel({ scope }: { scope: ScopedOwner }) {
  const roles = useInfiniteQuery(rolesOptions(scope));
  const permissions = useQuery(permissionsOptions(scope));
  const [selected, setSelected] = useState<string>();
  const [editing, setEditing] = useState(false);
  const records = roles.data?.pages.flatMap((page) => page.items) ?? [];
  const role = records.find((item) => item.id === selected);
  const retire = useWorkspaceMutation(
    scope,
    "roles",
    (input: { id: string; version: number; reason: string }, signal) =>
      workspaceApi.retireRole(
        scope,
        scope.workspaceId,
        input.id,
        { expectedVersion: input.version, reason: input.reason },
        signal,
      ),
  );
  return (
    <section className="flex min-w-0 flex-col gap-6" aria-label="Roles">
      <h2 className="text-xl font-semibold">Roles</h2>
      <RefreshButton
        refresh={() => Promise.all([roles.refetch(), permissions.refetch()])}
        pending={roles.isFetching || permissions.isFetching}
      />
      <ReadState
        query={roles}
        queryKey={resourceKey(scope, "roles")}
        scope="Roles"
        empty={!records.length}
      >
        <ul className="flex flex-col gap-4">
          {records.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3"
            >
              <span className="min-w-0 break-words">
                {item.name} <Badge variant="secondary">{item.origin}</Badge>{" "}
                {item.retiredAt ? (
                  <Badge variant="outline">Retired</Badge>
                ) : null}
              </span>
              <Button
                variant="outline"
                className="max-w-full min-w-0 whitespace-normal break-all"
                disabled={
                  editing || item.origin === "system" || Boolean(item.retiredAt)
                }
                onClick={() => {
                  setSelected(item.id);
                  setEditing(true);
                }}
              >
                Edit {item.name}
              </Button>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          Built-in and retired definitions cannot be edited. Finish or cancel an
          open editor before choosing another role.
        </p>
        <LoadMore
          more={roles.hasNextPage}
          pending={roles.isFetching}
          load={roles.fetchNextPage}
        />
        {role && role.origin === "custom" && !role.retiredAt ? (
          <ConfirmAction
            label="Retire role"
            target={role.name}
            consequence="This role will become unavailable for future assignments and offers. Existing references can block retirement."
            pending={retire.isPending}
            error={retire.error}
            onConfirm={async (reason) =>
              Boolean(
                reason &&
                (await retire.run({
                  id: role.id,
                  version: role.version,
                  reason,
                })),
              )
            }
          />
        ) : null}
      </ReadState>
      <Separator />
      <ReadState
        query={permissions}
        queryKey={resourceKey(scope, "permissions")}
        scope="Delegable permissions"
      >
        {!roles.error && permissions.data ? (
          <>
            {!editing ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSelected(undefined);
                  setEditing(true);
                }}
              >
                Create role
              </Button>
            ) : null}
            {editing ? (
              <RoleForm
                key={role ? role.id : "new"}
                scope={scope}
                permissions={permissions.data.codes}
                role={role}
                onCancel={() => {
                  setEditing(false);
                  setSelected(undefined);
                }}
              />
            ) : null}
          </>
        ) : null}
      </ReadState>
    </section>
  );
}
