import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { SessionOwner } from "@/features/workspaces/api/request";
import {
  personalNominationsOptions,
  personalNominationsKey,
  type OfferStatus,
} from "@/features/workspaces/api/queries";
import { StatusFilter } from "@/features/workspaces/components/StatusFilter";
import {
  ReadState,
  LoadMore,
} from "@/features/workspaces/components/ReadState";
import { RefreshButton } from "@/features/workspaces/components/ApiFeedback";
import { NominationList } from "@/features/workspaces/ownership/NominationList";

export function PersonalNominations({ owner }: { owner: SessionOwner }) {
  const [status, setStatus] = useState<OfferStatus>("pending");
  const query = useInfiniteQuery(personalNominationsOptions(owner, status));
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const [expanded, setExpanded] = useState<boolean | undefined>();
  const isExpanded = expanded ?? items.length > 0;
  return (
    <section
      aria-label="Your Owner nominations"
      className="flex flex-col gap-4"
    >
      <h2 className="text-xl font-semibold">Your Owner nominations</h2>
      <button
        type="button"
        className="min-h-11 self-start text-sm underline"
        aria-expanded={isExpanded}
        aria-controls="personal-nominations-content"
        onClick={() => {
          setExpanded(!isExpanded);
        }}
      >
        {isExpanded ? "Hide nominations" : "Review nominations"}
      </button>
      <div
        id="personal-nominations-content"
        hidden={!isExpanded}
        className="flex flex-col gap-4"
      >
        <p className="text-sm text-muted-foreground">
          A nomination grants nothing until you accept. Acceptance adds an Owner
          and does not transfer ownership automatically.
        </p>
        <StatusFilter
          id="personal-nomination-status"
          value={status}
          onChange={setStatus}
        />
        <RefreshButton refresh={query.refetch} pending={query.isFetching} />
        <ReadState
          query={query}
          queryKey={personalNominationsKey(owner.accountId)}
          scope="Owner nominations"
          empty={!items.length}
        >
          <NominationList owner={owner} items={items} />
          <LoadMore
            more={query.hasNextPage}
            pending={query.isFetching}
            load={query.fetchNextPage}
          />
        </ReadState>
      </div>
    </section>
  );
}
