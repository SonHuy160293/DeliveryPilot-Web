import { Alert, AlertDescription } from "@/components/ui/alert";
import type { EngagementDetail } from "@/features/engagements/api/types";
import { formatInstant } from "@/lib/format";

export function EngagementDetailNotices({
  engagement,
  duplicate,
  people,
}: {
  engagement: EngagementDetail;
  duplicate: boolean;
  people: Readonly<Record<string, string>>;
}) {
  return (
    <>
      {engagement.status === "Closed" ? (
        <Alert role="status">
          <AlertDescription>
            <p>
              This engagement is closed. Closed engagements are read-only.
              Reopen it to make changes.
            </p>
            <p>
              Closed {formatInstant(engagement.closedAt)} by{" "}
              {engagement.closedByUserId
                ? (people[engagement.closedByUserId] ?? "Name unavailable")
                : "Name unavailable"}
              .
            </p>
          </AlertDescription>
        </Alert>
      ) : null}
      {duplicate ? (
        <Alert role="alert">
          <AlertDescription>
            Another active engagement in this workspace uses agreement reference{" "}
            {engagement.agreementReference}. Check that this is not a duplicate.
          </AlertDescription>
        </Alert>
      ) : null}
    </>
  );
}
