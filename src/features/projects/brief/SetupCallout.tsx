import { Link } from "react-router";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { workspaceProjectPath } from "@/lib/routes";
import { formatCount } from "@/lib/format";
import type { ActivationRejected } from "@/features/projects/api/types";
export function SetupCallout({
  gaps,
  workspaceId,
  projectId,
}: {
  gaps: ActivationRejected["gaps"];
  workspaceId: string;
  projectId: string;
}) {
  return (
    <Alert role="status">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
        <p>
          {formatCount(gaps.length)} setup{" "}
          {gaps.length === 1 ? "step" : "steps"} missing
        </p>
        <Button variant="outline" asChild>
          <Link
            to={`${workspaceProjectPath(workspaceId, projectId, "settings")}#activation`}
          >
            Review setup
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}
