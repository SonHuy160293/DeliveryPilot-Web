import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/DataTable";
import { formatDate } from "@/lib/format";
import { briefLabels } from "@/features/portal/components/labels";
import type { GuestProjectView } from "@/features/portal/api/types";
function SharedDate({ value }: { value: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      Shared on <time dateTime={value}>{formatDate(value.slice(0, 10))}</time>
    </p>
  );
}
export function SharedItems({ view }: { view: GuestProjectView }) {
  const empty =
    !view.sharedBriefItems.length &&
    !view.sharedStakeholders.length &&
    !view.sharedEngagementSummary;
  return (
    <section
      aria-label="Shared with you"
      className="flex min-w-0 flex-col gap-4"
    >
      <h2 className="text-xl font-semibold">Shared with you</h2>
      {empty ? <p>Nothing has been shared with you yet.</p> : null}
      {view.sharedBriefItems.map((item) => (
        <article key={item.code}>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3>{briefLabels[item.code]}</h3>
              </CardTitle>
              <SharedDate value={item.sharedAt} />
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line break-words">
                {item.value?.trim() || "Not yet written"}
              </p>
            </CardContent>
          </Card>
        </article>
      ))}
      {view.sharedStakeholders.map((item) => (
        <article key={item.id}>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3>
                  Stakeholder: {item.name} ({item.side}
                  {item.organizationName ? `, ${item.organizationName}` : ""})
                </h3>
              </CardTitle>
              <SharedDate value={item.sharedAt} />
            </CardHeader>
            <CardContent className="space-y-3">
              <p>Responsibilities: {item.responsibilities || "Not recorded"}</p>
              <p>Decision areas: {item.decisionAreas || "Not recorded"}</p>
            </CardContent>
          </Card>
        </article>
      ))}
      {view.sharedEngagementSummary ? (
        <article>
          <Card>
            <CardHeader>
              <CardTitle>
                <h3>Engagement summary</h3>
              </CardTitle>
              <SharedDate value={view.sharedEngagementSummary.sharedAt} />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p>
                {view.sharedEngagementSummary.clientDisplayName} ·{" "}
                {view.sharedEngagementSummary.engagementName} ·{" "}
                {view.sharedEngagementSummary.agreementReference} ·{" "}
                {view.sharedEngagementSummary.status}
              </p>
              <DataTable
                caption="Milestones"
                rows={view.sharedEngagementSummary.milestones}
                rowKey={(row) => row.id}
                rowHeader={(row) => row.name}
                columns={[
                  { id: "name", header: "Milestone", cell: () => null },
                  {
                    id: "original",
                    header: "Original",
                    cell: (row) => (
                      <time dateTime={row.originalTargetDate}>
                        {formatDate(row.originalTargetDate)}
                      </time>
                    ),
                  },
                  {
                    id: "current",
                    header: "Current",
                    cell: (row) => (
                      <time dateTime={row.currentTargetDate}>
                        {formatDate(row.currentTargetDate)}
                      </time>
                    ),
                  },
                  { id: "status", header: "Status", cell: (row) => row.status },
                ]}
              />
            </CardContent>
          </Card>
        </article>
      ) : null}
    </section>
  );
}
