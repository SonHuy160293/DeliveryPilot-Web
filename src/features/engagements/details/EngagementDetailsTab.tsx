import { DefinitionList } from "@/components/DefinitionList";
import type { EngagementDetail } from "@/features/engagements/api/types";
import { formatDate, formatInstant } from "@/lib/format";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { EditDetailsDialog } from "@/features/engagements/details/EditDetailsDialog";

export function EngagementDetailsTab({
  engagement: row,
  people,
  canManage,
  actions,
}: {
  engagement: EngagementDetail;
  people: Readonly<Record<string, string>>;
  canManage: boolean;
  actions: EngagementActions;
}) {
  return (
    <section className="flex flex-col gap-4" aria-label="Engagement details">
      <h2 className="text-xl font-semibold">Details</h2>
      {canManage && row.status === "Active" ? (
        <EditDetailsDialog engagement={row} actions={actions} />
      ) : null}
      <DefinitionList
        items={[
          {
            id: "client",
            label: "Client display name",
            value: row.clientDisplayName,
          },
          {
            id: "legal",
            label: "Client legal name",
            value: row.clientLegalName,
          },
          { id: "country", label: "Country", value: row.clientCountryCode },
          { id: "name", label: "Engagement name", value: row.engagementName },
          {
            id: "reference",
            label: "Agreement reference",
            value: row.agreementReference,
          },
          {
            id: "signed",
            label: "Signed on",
            value: formatDate(row.agreementSignedOn),
          },
          {
            id: "document",
            label: "Agreement document",
            value: row.documentUrl ? (
              <a
                className="break-all underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
                href={row.documentUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                Open document{" "}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            ) : null,
          },
          {
            id: "created",
            label: "Created",
            value: `${formatInstant(row.createdAt)} by ${people[row.createdByUserId] ?? "Name unavailable"}`,
          },
          {
            id: "updated",
            label: "Updated",
            value: formatInstant(row.updatedAt),
          },
        ]}
      />
    </section>
  );
}
