import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import type { AuditInput } from "@/features/workspaces/api/auditContracts";
import {
  auditOptions,
  resourceKey,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import { ReadState, LoadMore } from "@/components/ReadState";
import { RefreshButton } from "@/components/ApiFeedback";
import { formatInstant, formatNumber } from "@/lib/format";
import { AuditFilters } from "@/features/workspaces/audit/AuditFilters";
import { AuditChanges } from "@/features/workspaces/audit/AuditChanges";
import { auditLabels } from "@/features/workspaces/audit/auditLabels";

export default function AuditPanel({ scope }: { scope: ScopedOwner }) {
  const [filters, setFilters] = useState<AuditInput>({});
  const options = auditOptions(scope, filters);
  const query = useInfiniteQuery(options);
  const client = useQueryClient();
  const records = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section className="flex min-w-0 flex-col gap-6" aria-label="Audit history">
      <h2 className="text-xl font-semibold">Audit history</h2>
      <AuditFilters onApply={setFilters} />
      {Object.keys(filters).length ? (
        <p role="status" className="text-sm">
          Audit filters applied.
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">
        Events retain server order. Membership history follows recorded
        revisions, and continuation is not a snapshot across requests.
      </p>
      <RefreshButton refresh={query.refetch} pending={query.isFetching} />
      {query.error ? (
        <Button
          variant="outline"
          onClick={() => {
            void client.resetQueries({
              queryKey: options.queryKey,
              exact: true,
            });
          }}
        >
          Restart audit pagination
        </Button>
      ) : null}
      <ReadState
        query={query}
        queryKey={resourceKey(scope, "audit")}
        scope="Audit events"
        empty={!records.length}
      >
        <ol className="flex flex-col gap-6">
          {records.map((event) => (
            <li
              key={event.eventId}
              className="flex min-w-0 flex-col gap-3 border-b border-border pb-4"
            >
              <h3 className="break-words text-base font-semibold">
                {auditLabels[event.action]}
              </h3>
              <p className="text-sm">
                {formatInstant(event.occurredAt)} ·{" "}
                {event.actorDisplayName ??
                  (event.actorUserId ? "Historical account" : "System")}{" "}
                · revision {formatNumber(event.aggregateVersion)}
              </p>
              {event.reason ? (
                <p className="break-words text-sm">Reason: {event.reason}</p>
              ) : null}
              <AuditChanges event={event} />
            </li>
          ))}
        </ol>
        <LoadMore
          more={query.hasNextPage}
          pending={query.isFetching}
          load={query.fetchNextPage}
        />
      </ReadState>
    </section>
  );
}
