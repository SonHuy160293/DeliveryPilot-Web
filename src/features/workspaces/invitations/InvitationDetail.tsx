import { useQuery } from "@tanstack/react-query";
import type { Invitation } from "@/features/workspaces/api/contracts";
import {
  invitationOptions,
  resourceKey,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { ReadState } from "@/components/ReadState";
import { RefreshButton } from "@/components/ApiFeedback";
import { InvitationSummary } from "@/features/workspaces/invitations/InvitationSummary";
import { InvitationActions } from "@/features/workspaces/invitations/InvitationActions";

export function InvitationDetail({
  scope,
  id,
  onChanged,
}: {
  scope: ScopedOwner;
  id: string;
  onChanged: (value: Invitation) => void;
}) {
  const query = useQuery(invitationOptions(scope, id));
  return (
    <ReadState
      query={query}
      queryKey={resourceKey(scope, "invitations")}
      scope="Invitation detail"
    >
      {query.data ? (
        <>
          <InvitationSummary invitation={query.data} />
          <RefreshButton refresh={query.refetch} pending={query.isFetching} />
          <InvitationActions
            key={`${query.data.id}:${String(query.data.version)}`}
            scope={scope}
            invitation={query.data}
            onChanged={onChanged}
          />
        </>
      ) : null}
    </ReadState>
  );
}
