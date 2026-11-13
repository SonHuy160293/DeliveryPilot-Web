import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  nominationsOptions,
  membersOptions,
  resourceKey,
  type OfferStatus,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { StatusFilter } from "@/features/workspaces/components/StatusFilter";
import { ReadState, LoadMore } from "@/components/ReadState";
import { RefreshButton } from "@/components/ApiFeedback";
import { NominationList } from "@/features/workspaces/ownership/NominationList";
import { NominateOwner } from "@/features/workspaces/ownership/NominateOwner";

export default function OwnershipPanel({ scope }: { scope: ScopedOwner }) {
  const [status, setStatus] = useState<OfferStatus>("pending");
  const query = useInfiniteQuery(nominationsOptions(scope, status));
  const members = useInfiniteQuery(membersOptions(scope));
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section aria-label="Ownership" className="flex flex-col gap-6">
      <h2 className="text-xl font-semibold">Ownership</h2>
      <p className="text-sm">
        Existing Owners remain when a nominee accepts. Step-down is a separate
        action on the current membership. Your received nominations are on the
        workspace selection page.
      </p>
      <NominateOwner scope={scope} />
      <StatusFilter id="ownership-status" value={status} onChange={setStatus} />
      <RefreshButton refresh={query.refetch} pending={query.isFetching} />
      <ReadState
        query={query}
        queryKey={resourceKey(scope, "nominations")}
        scope="Workspace nominations"
        empty={!items.length}
      >
        <NominationList
          owner={scope}
          items={items}
          management
          members={
            members.error
              ? []
              : (members.data?.pages.flatMap((page) => page.items) ?? [])
          }
        />
        <LoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          load={query.fetchNextPage}
        />
      </ReadState>
    </section>
  );
}
