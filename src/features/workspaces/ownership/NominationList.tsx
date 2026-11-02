import { Badge } from "@/components/ui/badge";
import { useInfiniteQuery } from "@tanstack/react-query";
import { discoveryOptions } from "@/features/workspaces/api/queries";
import type { Member, Nomination } from "@/features/workspaces/api/contracts";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { formatInstant } from "@/features/workspaces/model/formatters";
import { NominationActions } from "@/features/workspaces/ownership/NominationActions";

export function NominationList({
  owner,
  items,
  management = false,
  members = [],
}: {
  owner: SessionOwner;
  items: Nomination[];
  management?: boolean;
  members?: Member[];
}) {
  const discovery = useInfiniteQuery(discoveryOptions(owner));
  const workspaces = discovery.error
    ? []
    : (discovery.data?.pages.flatMap((page) => page.items) ?? []);
  return (
    <ul className="flex flex-col gap-6">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex min-w-0 flex-col gap-3 border-b border-border pb-4"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="break-all text-base font-semibold">
              {workspaces.find(
                (workspace) => workspace.organizationId === item.organizationId,
              )?.name ?? "Workspace nomination"}
            </h3>
            <Badge variant="secondary">{item.status}</Badge>
          </div>
          {management &&
          members.find(
            (member) => member.membershipId === item.membershipId,
          ) ? (
            <p className="break-words text-sm">
              Nominee:{" "}
              {
                members.find(
                  (member) => member.membershipId === item.membershipId,
                )?.displayName
              }{" "}
              ·{" "}
              {
                members.find(
                  (member) => member.membershipId === item.membershipId,
                )?.primaryEmail
              }
            </p>
          ) : null}
          <details>
            <summary className="cursor-pointer text-sm">Identifiers</summary>
            <p className="break-all text-sm">
              Workspace ID: {item.organizationId} · Nominee membership ID:{" "}
              {item.membershipId}
            </p>
          </details>
          <p className="text-sm">
            Created {formatInstant(item.createdAt)} · Deadline{" "}
            {formatInstant(item.expiresAt)}
          </p>
          <NominationActions
            key={`${item.id}:${String(item.version)}`}
            owner={owner}
            nomination={item}
            management={management}
            nomineeName={
              members.find(
                (member) => member.membershipId === item.membershipId,
              )?.displayName
            }
            workspaceName={
              workspaces.find(
                (workspace) => workspace.organizationId === item.organizationId,
              )?.name
            }
          />
        </li>
      ))}
    </ul>
  );
}
