import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuthSession } from "@/lib/api/useAuthSession";
import { discoveryOptions } from "@/features/workspaces/api/queries";
import { ReadState, LoadMore } from "@/components/ReadState";
import { isForbidden } from "@/lib/query/useDeniedCleanup";
import { authSession } from "@/lib/api/authSession";
import { ROUTES, workspaceOverviewPath } from "@/lib/routes";

export function WorkspaceSwitcher({ onNavigate }: { onNavigate?: () => void }) {
  const session = useAuthSession();
  return session.status === "authenticated" ? (
    <Picker
      key={`${session.userId}:${String(authSession.version())}`}
      owner={{ accountId: session.userId, generation: authSession.version() }}
      onNavigate={onNavigate}
    />
  ) : null;
}

function Picker({
  owner,
  onNavigate,
}: {
  owner: { accountId: string; generation: number };
  onNavigate?: () => void;
}) {
  const { workspaceSlug } = useParams<{ workspaceSlug: string }>();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const options = discoveryOptions(owner);
  const query = useInfiniteQuery(options);
  const items = isForbidden(query.error)
    ? []
    : (query.data?.pages.flatMap((page) => page.items) ?? []);
  const current = items.find(
    (item) =>
      item.organizationId.toLowerCase() === workspaceSlug?.toLowerCase(),
  );
  const matching = items.filter((item) =>
    item.name.toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase()),
  );
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-w-0 max-w-full md:max-w-xs">
          <span className="truncate">
            {current?.name ??
              (workspaceSlug ? "Choose workspace" : "Workspaces")}
          </span>
          <span className="sr-only">: switch workspace</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Switch workspace</DialogTitle>
          <DialogDescription>
            Choose from your current workspaces.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="switcher-filter">Search workspaces</Label>
          <Input
            id="switcher-filter"
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
            }}
          />
        </div>
        <ReadState query={query} queryKey={options.queryKey} scope="Workspaces">
          {matching.length ? (
            <ul className="flex flex-col gap-2">
              {matching.map((item) => (
                <li key={item.organizationId}>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start whitespace-normal break-words"
                  >
                    <Link
                      to={workspaceOverviewPath(item.organizationId)}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                    >
                      {item.name}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No matching workspaces.</p>
          )}
          <LoadMore
            more={query.hasNextPage}
            pending={query.isFetching}
            load={query.fetchNextPage}
          />
        </ReadState>
        <Button asChild variant="ghost">
          <Link
            to={ROUTES.workspaces}
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
          >
            All workspaces
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
