import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { ReadState } from "@/components/ReadState";
import { DataTable } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  linkedProjectsQuery,
  type EngagementScope,
} from "@/features/engagements/api/queries";
import { workspaceProjectPath, workspaceProjectsPath } from "@/lib/routes";
import { statusTone } from "@/lib/statusTone";
export function LinkedProjectsTab({
  scope,
  engagementId,
  canCreate,
}: {
  scope: EngagementScope;
  engagementId: string;
  canCreate: boolean;
}) {
  const options = linkedProjectsQuery(scope, engagementId),
    query = useQuery(options),
    search = new URLSearchParams({ create: "1", engagementId });
  return (
    <section className="flex flex-col gap-4" aria-label="Projects">
      <h2 className="text-xl font-semibold">Projects</h2>
      <p>
        You see project names, status and administrators. Project content needs
        project access.
      </p>
      <ReadState
        query={query}
        queryKey={options.queryKey}
        scope="Projects"
        empty={query.data?.length === 0}
        emptyTitle="No projects under this engagement yet."
        emptyDescription=""
        emptyAction={
          canCreate ? (
            <Button asChild>
              <Link
                to={`${workspaceProjectsPath(scope.workspaceId)}?${search.toString()}`}
              >
                Create project
              </Link>
            </Button>
          ) : undefined
        }
      >
        <DataTable
          caption="Projects under this engagement"
          rows={query.data ?? []}
          rowKey={(row) => row.projectId}
          rowHeader={(row) =>
            row.callerParticipates ? (
              <Link
                className="underline"
                to={workspaceProjectPath(scope.workspaceId, row.projectId)}
              >
                {row.name}
              </Link>
            ) : (
              row.name
            )
          }
          columns={[
            { id: "name", header: "Project", cell: () => null },
            {
              id: "status",
              header: "Status",
              cell: (row) => (
                <StatusBadge label={row.status} tone={statusTone(row.status)} />
              ),
            },
            {
              id: "administrators",
              header: "Administrators",
              cell: (row) =>
                row.administratorNames
                  .map((name) => name?.trim() || "Name unavailable")
                  .join(", ") || "Not recorded",
            },
          ]}
        />
      </ReadState>
    </section>
  );
}
