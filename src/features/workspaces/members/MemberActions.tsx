import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Member } from "@/features/workspaces/api/contracts";
import {
  rolesOptions,
  resourceKey,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { useWorkspaceMutation } from "@/features/workspaces/model/useWorkspaceMutation";
import { ConfirmAction } from "@/features/workspaces/components/ConfirmAction";
import {
  ReadState,
  LoadMore,
} from "@/features/workspaces/components/ReadState";
import { ApiFeedback } from "@/features/workspaces/components/ApiFeedback";

type Action = {
  kind: "grant" | "revoke" | "remove" | "demote";
  roleId?: string;
  reason: string | null;
};
export function MemberActions({
  scope,
  member,
}: {
  scope: ScopedOwner;
  member: Member;
}) {
  const roles = useInfiniteQuery(rolesOptions(scope));
  const [roleId, setRoleId] = useState("");
  const available =
    roles.data?.pages
      .flatMap((page) => page.items)
      .filter((role) => !role.retiredAt && role.code !== "owner") ?? [];
  const write = useWorkspaceMutation(
    scope,
    "members",
    (input: Action, signal) => {
      const body = {
        expectedMembershipVersion: member.version,
        reason: input.reason,
      };
      if (input.kind === "grant" || input.kind === "revoke")
        return workspaceApi[input.kind](
          scope,
          scope.workspaceId,
          member.membershipId,
          input.roleId ?? "",
          body,
          signal,
        );
      return workspaceApi[input.kind](
        scope,
        scope.workspaceId,
        member.membershipId,
        { ...body, reason: input.reason ?? "" },
        signal,
      );
    },
  );
  const confirm =
    (kind: Action["kind"], selectedRoleId?: string) =>
    async (reason: string | null) =>
      Boolean(await write.run({ kind, roleId: selectedRoleId, reason }));
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Actions are checked separately from read access. Refresh the membership
        after a conflict before reviewing another action.
      </p>
      <h4 className="text-base font-semibold">Manage roles</h4>
      <ReadState
        query={roles}
        queryKey={resourceKey(scope, "roles")}
        scope="Assignable roles"
      >
        <Label htmlFor="grant-role">Role to grant</Label>
        <Select value={roleId} onValueChange={setRoleId}>
          <SelectTrigger id="grant-role">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {available.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <LoadMore
          more={roles.hasNextPage}
          pending={roles.isFetching}
          load={roles.fetchNextPage}
        />
        <ConfirmAction
          label="Grant role"
          target={member.displayName}
          reasonMode="optional"
          consequence="The selected ordinary role will be granted if your current delegation allows it."
          pending={write.isPending}
          error={write.error}
          disabled={!roleId || member.status !== "active"}
          onConfirm={confirm("grant", roleId)}
        />
      </ReadState>
      <div className="flex flex-wrap gap-3">
        {member.roles
          .filter((role) => role.code !== "owner")
          .map((role) => (
            <ConfirmAction
              key={role.id}
              label={`Revoke ${role.name}`}
              target={member.displayName}
              reasonMode={role.code === "admin" ? "required" : "optional"}
              consequence="This role grant will close. Historical grants remain recorded."
              pending={write.isPending}
              error={write.error}
              onConfirm={confirm("revoke", role.id)}
            />
          ))}
      </div>
      <h4 className="text-base font-semibold">Membership access</h4>
      <div className="flex flex-wrap gap-3">
        <ConfirmAction
          label="Remove member"
          target={member.displayName}
          consequence="Workspace membership and current role grants will close. The account itself is not deleted."
          pending={write.isPending}
          error={write.error}
          disabled={member.status !== "active"}
          onConfirm={confirm("remove")}
        />
        {member.roles.some((role) => role.code === "owner") ? (
          <ConfirmAction
            label="Demote Owner"
            target={member.displayName}
            consequence="Only Owner is revoked. Another eligible Owner must remain; other roles or the server's Member fallback are retained."
            pending={write.isPending}
            error={write.error}
            onConfirm={confirm("demote")}
          />
        ) : null}
      </div>
      {write.isSuccess ? (
        <ApiFeedback>
          {write.data.changed
            ? "The membership change was confirmed."
            : "The server confirmed the assignment was already in the requested state."}
        </ApiFeedback>
      ) : null}
    </div>
  );
}
