import type { ReactNode } from "react";
import { Building2, Mail, ShieldCheck } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import type { SessionOwner } from "@/features/workspaces/api/request";
import {
  discoveryOptions,
  personalNominationsOptions,
} from "@/features/workspaces/api/queries";
import {
  formatLoadedCount,
  isManagedWorkspace,
} from "@/features/workspaces/model/portfolio";

function Stat({
  icon,
  value,
  label,
  className = "",
  onSelect,
}: {
  icon: ReactNode;
  value: string | undefined;
  label: string;
  className?: string;
  onSelect?: () => void;
}) {
  const body = (
    <>
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        <span className="text-2xl leading-none font-bold tracking-tight tabular-nums">
          {value ?? (
            <>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Not available</span>
            </>
          )}
        </span>
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      </span>
    </>
  );
  const surface =
    "flex w-full min-w-0 items-center gap-4 rounded-xl border border-border bg-card p-4 text-left md:p-6";
  return (
    <li className={className}>
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className={`${surface} transition-colors duration-150 ease-out hover:border-brand focus-visible:ring-2 focus-visible:ring-ring`}
        >
          {body}
        </button>
      ) : (
        <div className={surface}>{body}</div>
      )}
    </li>
  );
}

/** Counts come only from loaded, authorized reads; a trailing plus marks further pages. */
export function PortfolioStats({
  owner,
  onReviewNominations,
}: {
  owner: SessionOwner;
  onReviewNominations?: () => void;
}) {
  const workspaces = useInfiniteQuery(discoveryOptions(owner));
  const nominations = useInfiniteQuery(
    personalNominationsOptions(owner, "pending"),
  );
  const loaded = workspaces.data?.pages.flatMap((page) => page.items);
  const pending = nominations.data?.pages.flatMap((page) => page.items);
  return (
    <section aria-label="Portfolio summary">
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
        <Stat
          icon={<Building2 className="size-6" />}
          value={
            loaded && formatLoadedCount(loaded.length, workspaces.hasNextPage)
          }
          label="My workspaces"
        />
        <Stat
          icon={<ShieldCheck className="size-6" />}
          value={
            loaded &&
            formatLoadedCount(
              loaded.filter(isManagedWorkspace).length,
              workspaces.hasNextPage,
            )
          }
          label="Managed by me"
        />
        <Stat
          icon={<Mail className="size-6" />}
          value={
            pending &&
            formatLoadedCount(pending.length, nominations.hasNextPage)
          }
          label="Pending nominations"
          className="col-span-2 md:col-span-1"
          onSelect={pending?.length ? onReviewNominations : undefined}
        />
      </ul>
    </section>
  );
}
