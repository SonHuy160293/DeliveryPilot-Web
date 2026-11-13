import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { SectionHeading } from "@/components/SectionHeading";
import { ReadState } from "@/components/ReadState";
import { DataTable } from "@/components/DataTable";
import { ConfirmAction } from "@/components/ConfirmAction";
import { StatusMessage } from "@/components/StatusMessage";
import { MockDataBanner } from "@/components/MockDataBanner";
import {
  clientLinksQuery,
  removeClientWorkspaceLink,
  engagementRepositoryKind,
  type EngagementScope,
} from "@/features/engagements/api/queries";
import { LinkCodeForm } from "@/features/engagements/link/LinkCodeForm";
export default function ClientLinksPanel({
  scope,
  workspaceName,
}: {
  scope: EngagementScope;
  workspaceName: string;
}) {
  const options = clientLinksQuery(scope),
    query = useQuery(options),
    client = useQueryClient(),
    [message, setMessage] = useState<string | null>(null),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false),
    mock = engagementRepositoryKind() === "mock";
  async function refresh() {
    await client.invalidateQueries({ queryKey: options.queryKey });
  }
  return (
    <section aria-label="Client links" className="flex flex-col gap-6">
      <SectionHeading
        title="Client links"
        description="Vendors can link their engagement with your company to this workspace. Linking does not give anyone access to anything."
      />
      <StatusMessage
        message={message}
        mock={mock}
        onDismiss={() => {
          setMessage(null);
        }}
      />
      <LinkCodeForm
        scope={scope}
        workspaceName={workspaceName}
        onConfirmed={async () => {
          await refresh();
          setMessage("Engagement linked.");
        }}
      />
      <h3 className="text-lg font-semibold">Linked engagements</h3>
      <ReadState
        query={query}
        queryKey={options.queryKey}
        scope="Linked engagements"
        empty={query.data?.length === 0}
        emptyTitle="No linked engagements."
        emptyDescription=""
      >
        <DataTable
          caption="Linked engagements"
          rows={query.data ?? []}
          rowKey={(row) => row.engagementId}
          rowHeader={(row) => row.engagementName ?? "Not named"}
          columns={[
            { id: "name", header: "Engagement", cell: () => null },
            {
              id: "client",
              header: "Client name used by vendor",
              cell: (row) => row.clientDisplayName,
            },
            {
              id: "actions",
              header: "Actions",
              cell: (row) => (
                <ConfirmAction
                  showAuthorityNotice={false}
                  label="Remove link"
                  target={row.engagementName ?? row.clientDisplayName}
                  consequence="The vendor's engagement will no longer be linked to this workspace. No access changes."
                  reasonMode="none"
                  pending={pending}
                  error={error}
                  onOpenChange={() => {
                    setError(undefined);
                  }}
                  onConfirm={async () => {
                    setPending(true);
                    try {
                      await removeClientWorkspaceLink(
                        scope,
                        row.engagementId,
                        row.version,
                      );
                      await refresh();
                      setMessage("Link removed.");
                      return true;
                    } catch (failure) {
                      setError(failure);
                      return false;
                    } finally {
                      setPending(false);
                    }
                  }}
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
