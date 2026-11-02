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
import {
  membersOptions,
  resourceKey,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { useWorkspaceMutation } from "@/features/workspaces/model/useWorkspaceMutation";
import {
  ReadState,
  LoadMore,
} from "@/features/workspaces/components/ReadState";
import { ConfirmAction } from "@/features/workspaces/components/ConfirmAction";
import { ApiFeedback } from "@/features/workspaces/components/ApiFeedback";

export function NominateOwner({ scope }: { scope: ScopedOwner }) {
  const query = useInfiniteQuery(membersOptions(scope));
  const [selected, setSelected] = useState("");
  const members =
    query.data?.pages
      .flatMap((page) => page.items)
      .filter(
        (member) => !member.roles.some((role) => role.code === "owner"),
      ) ?? [];
  const write = useWorkspaceMutation(scope, "ownership", (id: string, signal) =>
    workspaceApi.nominate(scope, scope.workspaceId, id, signal),
  );
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Nominate an additional Owner</h3>
      <ReadState
        query={query}
        queryKey={resourceKey(scope, "members")}
        scope="Nomination candidates"
      >
        <Label htmlFor="owner-nominee">Active nominee</Label>
        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger id="owner-nominee">
            <SelectValue placeholder="Choose a current member" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {members.map((member) => (
                <SelectItem
                  key={member.membershipId}
                  value={member.membershipId}
                >
                  {member.displayName} · {member.primaryEmail}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <LoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          load={query.fetchNextPage}
        />
        <ConfirmAction
          label="Nominate Owner"
          target={
            members.find((member) => member.membershipId === selected)
              ?.displayName ?? "selected member"
          }
          consequence="An in-app nomination lasts seven days. No Owner grant or email is created by nomination."
          reasonMode="none"
          pending={write.isPending}
          error={write.error}
          disabled={!selected}
          onConfirm={async () => Boolean(await write.run(selected))}
        />
      </ReadState>
      {write.isSuccess ? (
        <ApiFeedback>
          Nomination was confirmed. The nominee must accept separately.
        </ApiFeedback>
      ) : null}
    </div>
  );
}
