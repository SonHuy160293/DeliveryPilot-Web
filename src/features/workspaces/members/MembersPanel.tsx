import { useEffect, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { memberStatus } from "@/features/workspaces/api/contracts";
import {
  membersOptions,
  resourceKey,
  type ScopedOwner,
} from "@/features/workspaces/api/queries";
import {
  ReadState,
  LoadMore,
} from "@/features/workspaces/components/ReadState";
import { RefreshButton } from "@/features/workspaces/components/ApiFeedback";
import { MemberDetail } from "@/features/workspaces/members/MemberDetail";
import { RoleBadges } from "@/features/workspaces/components/RoleBadges";
import { formatStatus } from "@/features/workspaces/model/formatters";

export default function MembersPanel({ scope }: { scope: ScopedOwner }) {
  const [status, setStatus] = useState<"active" | "removed" | "suspended">(
    "active",
  );
  const [selected, setSelected] = useState<string>();
  const detailHeading = useRef<HTMLHeadingElement>(null);
  const returnFocus = useRef<string | undefined>(undefined);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    if (selected) detailHeading.current?.focus();
  }, [selected]);
  const query = useInfiniteQuery(membersOptions(scope, status));
  const records = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <section className="flex flex-col gap-6" aria-label="Members">
      <h2 className="text-xl font-semibold">Members</h2>
      <div className="flex max-w-sm flex-col gap-2">
        <Label htmlFor="member-status">Membership status</Label>
        <Select
          value={status}
          onValueChange={(next) => {
            const parsed = memberStatus.safeParse(next);
            if (parsed.success) {
              setStatus(parsed.data);
              setSelected(undefined);
            }
          }}
        >
          <SelectTrigger id="member-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {memberStatus.options.map((item) => (
                <SelectItem key={item} value={item}>
                  {formatStatus(item)}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <RefreshButton refresh={query.refetch} pending={query.isFetching} />
      <ReadState
        query={query}
        queryKey={resourceKey(scope, "members")}
        scope="Members"
        empty={!records.length}
        emptyTitle={`No ${status} members found`}
        emptyDescription="Choose another membership status to review other members."
      >
        {selected ? (
          <section className="flex flex-col gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelected(undefined);
                requestAnimationFrame(() => {
                  if (returnFocus.current)
                    triggers.current.get(returnFocus.current)?.focus();
                });
              }}
            >
              Back to members
            </Button>
            <h3
              ref={detailHeading}
              tabIndex={-1}
              className="text-lg font-semibold"
            >
              Member details
            </h3>
            <MemberDetail key={selected} scope={scope} id={selected} />
          </section>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {records.map((member) => (
                <li
                  key={member.membershipId}
                  className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-3"
                >
                  <div className="flex min-w-0 flex-col gap-2">
                    <span className="break-words">{member.displayName}</span>
                    <span className="break-all text-sm text-muted-foreground">
                      {member.primaryEmail} · {formatStatus(member.status)}
                    </span>
                    <RoleBadges roles={member.roles} />
                  </div>
                  <Button
                    ref={(element) => {
                      if (element)
                        triggers.current.set(member.membershipId, element);
                      else triggers.current.delete(member.membershipId);
                    }}
                    variant="outline"
                    className="max-w-full min-w-0 whitespace-normal break-all"
                    onClick={() => {
                      returnFocus.current = member.membershipId;
                      setSelected(member.membershipId);
                    }}
                  >
                    View {member.displayName}
                  </Button>
                </li>
              ))}
            </ul>
            <LoadMore
              more={query.hasNextPage}
              pending={query.isFetching}
              load={query.fetchNextPage}
            />
          </>
        )}
      </ReadState>
    </section>
  );
}
