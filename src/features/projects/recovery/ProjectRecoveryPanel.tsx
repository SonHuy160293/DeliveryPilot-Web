import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SectionHeading } from "@/components/SectionHeading";
import { ReadState } from "@/components/ReadState";
import { DataTable } from "@/components/DataTable";
import { StatusMessage } from "@/components/StatusMessage";
import { MockDataBanner } from "@/components/MockDataBanner";
import {
  orphanedProjectsQuery,
  projectRepositoryKind,
  type ProjectScope,
} from "@/features/projects/api/queries";
import { AppointAdministratorDialog } from "@/features/projects/recovery/AppointAdministratorDialog";
export default function ProjectRecoveryPanel({
  scope,
}: {
  scope: ProjectScope;
}) {
  const options = orphanedProjectsQuery(scope),
    query = useQuery(options),
    [message, setMessage] = useState<string | null>(null),
    mock = projectRepositoryKind() === "mock";
  return (
    <section className="flex flex-col gap-6" aria-label="Project recovery">
      <SectionHeading
        title="Project recovery"
        description="Projects listed here have no active administrator. Appointing one does not give you access to the project."
      />
      <StatusMessage
        message={message}
        mock={mock}
        onDismiss={() => {
          setMessage(null);
        }}
      />
      <ReadState
        query={query}
        queryKey={options.queryKey}
        scope="Project recovery"
        empty={query.data?.length === 0}
        emptyTitle="Every project has an active administrator."
        emptyDescription=""
      >
        <DataTable
          caption="Projects without an administrator"
          rows={query.data ?? []}
          rowKey={(row) => row.id}
          rowHeader={(row) => row.name}
          columns={[
            { id: "name", header: "Project", cell: () => null },
            { id: "status", header: "Status", cell: (row) => row.status },
            {
              id: "action",
              header: "Actions",
              cell: (row) => (
                <AppointAdministratorDialog
                  scope={scope}
                  project={row}
                  onSuccess={setMessage}
                />
              ),
            },
          ]}
        />
      </ReadState>
      {mock ? <MockDataBanner /> : null}
    </section>
  );
}
