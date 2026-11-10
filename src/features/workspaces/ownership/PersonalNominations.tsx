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
import { formatInstant } from "@/features/workspaces/model/formatters";

export const PERSONAL_NOMINATIONS_ID = "personal-nominations";

export function PersonalNominations({ owner }: { owner: SessionOwner }) {
  const [status, setStatus] = useState<OfferStatus>("pending");
  const query = useInfiniteQuery(personalNominationsOptions(owner, status));
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  const [expanded, setExpanded] = useState<boolean | undefined>();
  const isExpanded = expanded ?? items.length > 0;
  const earliest = items
    .map((item) => item.expiresAt)
    .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
  return (
    <section
      id={PERSONAL_NOMINATIONS_ID}
      tabIndex={-1}
      aria-label="Your ownership nominations"
      className="flex min-w-0 scroll-mt-24 flex-col gap-4 rounded-xl border border-callout-border bg-callout p-4 focus-visible:ring-2 focus-visible:ring-ring md:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <span
            aria-hidden="true"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
          >
            <Mail className="size-6" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">
              Ownership nominations
            </h2>
            <p className="text-sm text-muted-foreground">
              {items.length > 0
                ? `You have ${String(items.length)} ${status} ownership nomination${items.length === 1 ? "" : "s"} to review.${status === "pending" && earliest ? ` Respond by ${formatInstant(earliest)}.` : ""}`
                : "Review pending or past ownership nominations across your workspaces."}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full shrink-0 bg-card font-bold shadow-none sm:w-auto"
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
