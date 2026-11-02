import { useState } from "react";
import { Mail } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
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
      className="flex min-w-0 flex-col gap-4 rounded-xl border border-callout-border bg-callout p-4 text-callout-foreground shadow-sm md:px-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-callout-border bg-card text-callout-foreground"
          >
            <Mail className="size-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">
              Your Owner nominations
            </h2>
            <p className="text-sm text-callout-foreground">
              {items.length > 0
                ? `You have ${String(items.length)} ${status} ownership nomination${items.length === 1 ? "" : "s"} to review.`
                : "Review pending or historical ownership nominations across your workspaces."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 shrink-0 self-start border-callout-border bg-card text-callout-foreground hover:bg-accent hover:text-accent-foreground sm:self-center"
          aria-expanded={isExpanded}
          aria-controls="personal-nominations-content"
          onClick={() => {
            setExpanded(!isExpanded);
          }}
        >
          {isExpanded ? "Hide nominations" : "Review nominations"}
        </Button>
      </div>
      <div
        id="personal-nominations-content"
        hidden={!isExpanded}
        className="flex flex-col gap-4 border-t border-callout-border pt-4 text-foreground"
      >
        <p className="text-sm text-muted-foreground">
          A nomination grants nothing until you accept. Acceptance adds an Owner
          and does not transfer ownership automatically.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <StatusFilter
            id="personal-nomination-status"
            value={status}
            onChange={setStatus}
          />
          <RefreshButton refresh={query.refetch} pending={query.isFetching} />
        </div>
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
