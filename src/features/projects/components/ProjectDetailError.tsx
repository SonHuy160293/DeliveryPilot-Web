import { Link } from "react-router";
import { PageStateGate } from "@/components/PageStateGate";
import { Button } from "@/components/ui/button";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import { workspaceProjectsPath } from "@/lib/routes";
export function ProjectDetailError({
  error,
  workspaceId,
  retry,
  pending = false,
}: {
  error: unknown;
  workspaceId: string;
  retry: () => void;
  pending?: boolean;
}) {
  const unavailable = isProjectUnavailable(error);
  return (
    <PageStateGate
      state={unavailable ? "no-permission" : "error"}
      scope="project"
      presentation={{
        title: unavailable ? "Project unavailable" : "Could not load project",
        description: unavailable
          ? "This project isn't available. It may not exist, or you may not have access."
          : "The request could not be completed. Try again.",
        action: unavailable ? (
          <Button variant="outline" asChild>
            <Link to={workspaceProjectsPath(workspaceId)}>
              Back to projects
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
