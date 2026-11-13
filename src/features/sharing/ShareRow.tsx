import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApiFeedback } from "@/components/ApiFeedback";
import { ConfirmAction } from "@/components/ConfirmAction";
import { useRateLimit } from "@/lib/api/useRateLimit";
import { RetryDelay } from "@/components/RetryDelay";
import { formatDate } from "@/lib/format";
import type { GuestShare, ShareableItem } from "@/features/sharing/api/types";
import type { SharingActions } from "@/features/sharing/model/useSharingActions";
export interface ShareRowItem {
  label: string;
  item: ShareableItem;
  empty?: boolean;
  unavailable?: string;
}
export function ShareRow({
  entry,
  share,
  people,
  actions,
}: {
  entry: ShareRowItem;
  share?: GuestShare;
  people: Record<string, string>;
  actions: SharingActions;
}) {
  const [error, setError] = useState<unknown>(),
    [sharing, setSharing] = useState(false),
    rate = useRateLimit(error);
  const shared = share?.status === "Shared";
  const container = useRef<HTMLDivElement>(null);
  const requested = useRef<"share" | "withdraw" | undefined>(undefined);
  const confirmedWithdrawal = useRef(false);
  useEffect(() => {
    if (
      !actions.pending &&
      ((requested.current === "share" && shared) ||
        (requested.current === "withdraw" && !shared))
    ) {
      container.current?.querySelector("button")?.focus();
      requested.current = undefined;
    }
  }, [shared, actions.pending]);
  async function run(withdrawing: boolean, reason: string | null = null) {
    setError(undefined);
    setSharing(!withdrawing);
    requested.current = withdrawing ? "withdraw" : "share";
    confirmedWithdrawal.current = withdrawing;
    try {
      const done = await actions.run(
        withdrawing && share
          ? {
              action: "withdraw",
              shareId: share.id,
              expectedVersion: share.version,
              reason,
            }
          : { action: "share", item: entry.item },
        withdrawing
          ? `${entry.label} is no longer shared.`
          : `${entry.label} is now shared with this project's guests.`,
      );
      if (!done) requested.current = undefined;
      return done;
    } catch (failure) {
      confirmedWithdrawal.current = false;
      requested.current = undefined;
      setError(failure);
      return false;
    } finally {
      setSharing(false);
    }
  }
  return (
    <div ref={container} className="flex min-w-0 flex-col items-start gap-3">
      <Badge variant="outline">{shared ? "Shared" : "Internal"}</Badge>
      {shared && share.sharedAt ? (
        <p className="text-sm text-muted-foreground">
          since {formatDate(share.sharedAt.slice(0, 10))} by{" "}
          {people[share.sharedByUserId ?? ""] ?? "Name unavailable"}
        </p>
      ) : null}
      {entry.empty ? (
        <p className="text-sm text-muted-foreground">
          empty — guests see "Not yet written"
        </p>
      ) : null}
      {entry.unavailable ? (
        <p>{entry.unavailable}</p>
      ) : shared ? (
        <ConfirmAction
          showAuthorityNotice={false}
          label="Withdraw"
          target={entry.label}
          reasonMode="optional"
          consequence="Guests lose access on their next visit. This can't undo anything they already read."
          pending={actions.pending}
          error={error}
          onOpenChange={() => {
            setError(undefined);
          }}
          onCloseAutoFocus={(event) => {
            if (confirmedWithdrawal.current) {
              event.preventDefault();
              container.current?.querySelector("button")?.focus();
            }
          }}
          onConfirm={(reason) => run(true, reason)}
        />
      ) : (
        <>
          <Button
            variant="outline"
            disabled={actions.pending || rate.blocked}
            aria-label={`Share ${entry.label} with guests`}
            onClick={() => {
              void run(false);
            }}
          >
            {sharing ? "Sharing…" : "Share"}
          </Button>
          <ApiFeedback error={error} write />
          {rate.blocked ? <RetryDelay delay={rate.delay} /> : null}
        </>
      )}
    </div>
  );
}
