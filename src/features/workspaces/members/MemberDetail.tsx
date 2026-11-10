import { useQuery } from "@tanstack/react-query";
import {
  memberOptions,
  resourceKey,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { ReadState } from "@/features/workspaces/components/ReadState";
import { RefreshButton } from "@/features/workspaces/components/ApiFeedback";
import { RoleBadges } from "@/features/workspaces/components/RoleBadges";
import { MemberActions } from "@/features/workspaces/members/MemberActions";
import {
  formatInstant,
  formatStatus,
} from "@/features/workspaces/model/formatters";

export function MemberDetail({
  scope,
  id,
}: {
  scope: ScopedOwner;
  id: string;
}) {
  const query = useQuery(memberOptions(scope, id));
  return (
    <ReadState
      query={query}
      queryKey={resourceKey(scope, "members")}
      scope="Member detail"
    >
      {query.data ? (
        <section className="flex flex-col gap-4" aria-label="Selected member">
          <h3 className="break-words text-lg font-semibold">
            {query.data.displayName}
          </h3>
          <p className="break-all text-sm">
            {query.data.primaryEmail} · {formatStatus(query.data.status)}
          </p>
          <RoleBadges roles={query.data.roles} />
          <p className="text-sm">Joined {formatInstant(query.data.joinedAt)}</p>
          <RefreshButton refresh={query.refetch} pending={query.isFetching} />
          <MemberActions
            key={`${query.data.membershipId}:${String(query.data.version)}`}
            scope={scope}
            member={query.data}
          />
        </section>
      ) : null}
    </ReadState>
  );
}
