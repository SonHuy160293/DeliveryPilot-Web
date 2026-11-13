import { Link } from "react-router";
import { ScreenState } from "@/components/ScreenState";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
import { ROUTES } from "@/lib/routes";

export function EngagementReadError({
  error,
  retry,
  pending = false,
}: {
  error: unknown;
  retry: () => void;
  pending?: boolean;
}) {
  const identity =
    error instanceof ApiError && error.details.code === "Identity.Unavailable";
  const denied = error instanceof ApiError && error.kind === "forbidden";
  return (
    <ScreenState
      status={denied ? "no-permission" : "error"}
      scope="engagements"
      presentation={{
        title: denied ? "Access unavailable" : "Could not load engagements",
        description: identity
          ? "We couldn't confirm your access right now. Try again in a moment."
          : denied
            ? "Return to your workspaces to continue."
            : "The request could not be completed. Try again.",
        action: denied ? (
          <Button variant="outline" asChild>
            <Link to={ROUTES.workspaces}>Back to workspaces</Link>
          </Button>
        ) : (
          <Button variant="outline" disabled={pending} onClick={retry}>
            Try again
          </Button>
        ),
      }}
    />
  );
}
