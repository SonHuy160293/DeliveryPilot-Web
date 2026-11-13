import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Invitation } from "@/features/workspaces/api/contracts";
import {
  invitationsOptions,
  resourceKey,
  type OfferStatus,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { ReadState, LoadMore } from "@/components/ReadState";
import { StatusFilter } from "@/features/workspaces/components/StatusFilter";
import { ApiFeedback, RefreshButton } from "@/components/ApiFeedback";
import { IssueInvitationForm } from "@/features/workspaces/invitations/IssueInvitationForm";
import { InvitationDetail } from "@/features/workspaces/invitations/InvitationDetail";
import { InvitationSummary } from "@/features/workspaces/invitations/InvitationSummary";
import { InvitationActions } from "@/features/workspaces/invitations/InvitationActions";
import { formatStatus } from "@/lib/format";

export default function InvitationsPanel({ scope }: { scope: ScopedOwner }) {
  const [status, setStatus] = useState<OfferStatus>("pending");
  const [selected, setSelected] = useState<string>();
  const [issued, setIssued] = useState<Invitation>();
  const [issuing, setIssuing] = useState(false);
  const [issueVisited, setIssueVisited] = useState(false);
  const query = useInfiniteQuery(invitationsOptions(scope, status));
  const records = query.data?.pages.flatMap((page) => page.items) ?? [];
  function changed(value: Invitation) {
    setSelected(value.id);
    setIssued(value);
  }
  return (
    <section className="flex flex-col gap-6" aria-label="Invitations">
      <h2 className="text-xl font-semibold">Invitations</h2>
      <Button
        type="button"
        variant="outline"
        aria-expanded={issuing}
        aria-controls="invite-member-form"
        onClick={() => {
          setIssueVisited(true);
          setIssuing(!issuing);
        }}
      >
        {issuing ? "Hide invitation form" : "Invite member"}
      </Button>
      {issueVisited ? (
        <div id="invite-member-form" hidden={!issuing}>
          <IssueInvitationForm scope={scope} onIssued={changed} />
        </div>
      ) : null}
      {issued ? (
        <>
          <ApiFeedback>
            The invitation operation was confirmed. Membership has not been
            granted by this manager action.
          </ApiFeedback>
          <InvitationSummary invitation={issued} />
          <InvitationActions
            key={`${issued.id}:${String(issued.version)}`}
            scope={scope}
            invitation={issued}
            onChanged={changed}
          />
        </>
      ) : null}
      <Separator />
      <StatusFilter
        id="invitation-status"
        value={status}
        onChange={(next) => {
          setStatus(next);
          setSelected(undefined);
          setIssued(undefined);
        }}
      />
      <RefreshButton refresh={query.refetch} pending={query.isFetching} />
      <ReadState
        query={query}
        queryKey={resourceKey(scope, "invitations")}
        scope="Invitations"
        empty={!records.length}
      >
        <ul className="flex flex-col gap-3">
          {records.map((item) => (
            <li
              key={item.id}
              className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-3"
            >
              <span className="min-w-0 break-all">
                {item.recipientEmail} · {formatStatus(item.status)}
              </span>
              <Button
                variant="outline"
                onClick={() => {
                  setSelected(item.id);
                  setIssued(undefined);
                }}
              >
                View invitation
              </Button>
            </li>
          ))}
        </ul>
        <LoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          load={query.fetchNextPage}
        />
        {selected && !issued ? (
          <InvitationDetail
            key={selected}
            scope={scope}
            id={selected}
            onChanged={changed}
          />
        ) : null}
      </ReadState>
    </section>
  );
}
