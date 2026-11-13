import { Link } from "react-router";
import { PageStateGate } from "@/components/PageStateGate";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { workspaceEngagementsPath } from "@/lib/routes";

export function EngagementDetailError({
  error,
  workspaceId,
  retry,
  pending,
}: {
  error: unknown;
  workspaceId: string;
  retry: () => void;
  pending: boolean;
}) {
  const unavailable =
    error instanceof ApiError &&
    ["not-found", "forbidden"].includes(error.kind);
  const identity =
    error instanceof ApiError && error.details.code === "Identity.Unavailable";
  return (
    <PageStateGate
      state={unavailable ? "no-permission" : "error"}
      scope="engagement"
      presentation={{
        title: unavailable
          ? "Engagement unavailable"
          : "Could not load engagement",
        description: unavailable
          ? "This engagement isn't available. It may not exist, or you may not have access."
          : identity
            ? "We couldn't confirm your access right now. Try again in a moment."
            : "The request could not be completed. Try again.",
        action: unavailable ? (
          <Button variant="outline" asChild>
            <Link to={workspaceEngagementsPath(workspaceId)}>
              Back to engagements
            </Link>
          </Button>
        ) : (
          <Button variant="outline" onClick={retry} disabled={pending}>
            Try again
          </Button>
        ),
      }}
    >
      {null}
    </PageStateGate>
  );
}
