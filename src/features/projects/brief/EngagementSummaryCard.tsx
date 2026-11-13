import { Link } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DefinitionList } from "@/components/DefinitionList";
import { StatusBadge } from "@/components/StatusBadge";
import { statusTone } from "@/lib/statusTone";
import { formatDate } from "@/lib/format";
import { workspaceEngagementPath } from "@/lib/routes";
import type { ProjectOverviewContext } from "@/features/projects/api/types";
export function EngagementSummaryCard({
  context,
  workspaceId,
}: {
  context: NonNullable<ProjectOverviewContext["engagement"]>;
  workspaceId: string;
}) {
  const { summary, canOpenFullDetail } = context;
  return (
    <section aria-labelledby="engagement-summary-heading">
      <Card>
        <CardHeader>
          <CardTitle>
            <h3 id="engagement-summary-heading" className="text-lg">
              Engagement summary
            </h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
          <DefinitionList
            items={[
              {
                id: "client",
                label: "Client",
                value: summary.clientDisplayName,
              },
              {
                id: "engagement",
                label: "Engagement",
                value: canOpenFullDetail ? (
                  <Link
                    className="underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring"
                    to={workspaceEngagementPath(
                      workspaceId,
                      summary.engagementId,
                    )}
                  >
                    {summary.engagementName ?? "Not named"}
                  </Link>
                ) : (
                  summary.engagementName
                ),
              },
              {
                id: "reference",
                label: "Agreement reference",
                value: summary.agreementReference,
              },
              {
                id: "status",
                label: "Status",
                value: (
                  <StatusBadge
                    label={summary.status}
                    tone={statusTone(summary.status)}
                  />
                ),
              },
            ]}
          />
          <h4 className="font-medium">Milestones</h4>
          {summary.milestones.length ? (
            <ul className="flex min-w-0 flex-col gap-3">
              {summary.milestones.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <span className="min-w-0 break-words">{item.name}</span>
                  <time
                    dateTime={item.currentTargetDate}
                    className="text-sm text-muted-foreground"
                  >
                    {formatDate(item.currentTargetDate)}
                  </time>
                  <StatusBadge
                    label={item.status}
                    tone={statusTone(item.status)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No milestones yet</p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
