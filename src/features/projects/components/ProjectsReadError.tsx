import { PageStateGate } from "@/components/PageStateGate";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/apiError";
export function ProjectsReadError({
  error,
  retry,
  pending = false,
}: {
  error: unknown;
  retry: () => void;
  pending?: boolean;
}) {
  const identity = error instanceof ApiError && error.details.status === 503;
  return (
    <PageStateGate
      state="error"
      scope="projects"
      presentation={{
        title: "Could not load projects",
        description: identity
          ? "We couldn't confirm your access right now."
          : "The request could not be completed. Try again.",
        action: (
          <Button variant="outline" disabled={pending} onClick={retry}>
            Try again
          </Button>
        ),
      }}
    >
      {null}
    </PageStateGate>
  );
}
