import { Link } from "react-router";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { statusTone } from "@/lib/statusTone";
import { formatCount } from "@/lib/format";
import { workspaceProjectPath } from "@/lib/routes";
import type { ProjectListItem } from "@/features/projects/api/types";
import { projectRoleLabel } from "@/features/projects/model/roleLabels";
export function ProjectCard({
  project,
  workspaceId,
}: {
  project: ProjectListItem;
  workspaceId: string;
}) {
  return (
    <article
      aria-labelledby={`project-${project.id}-name`}
      className="h-full min-w-0"
    >
      <Card className="h-full min-w-0">
        <CardHeader>
          <CardTitle>
            <h3
              id={`project-${project.id}-name`}
              className="break-words text-lg font-semibold"
            >
              {project.name}
            </h3>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              label={project.status}
              tone={statusTone(project.status)}
            />
            <span className="text-sm text-muted-foreground">
              {project.kind === "Client"
                ? "Client project"
                : "Internal project"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 break-words">
          {project.engagement ? (
            <p>{project.engagement.clientDisplayName}</p>
          ) : null}
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">Sprint length</dt>
              <dd>
                {formatCount(project.sprintLengthWeeks)}{" "}
                {project.sprintLengthWeeks === 1 ? "week" : "weeks"}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-muted-foreground">Your roles</dt>
              <dd>{project.myRoles.map(projectRoleLabel).join(" · ")}</dd>
            </div>
          </dl>
          {project.status === "Draft" &&
          project.myRoles.includes("ProjectAdministrator") &&
          project.missingSetupCount !== undefined &&
          project.missingSetupCount > 0 ? (
            <p className="text-sm text-muted-foreground">
              {formatCount(project.missingSetupCount)} setup{" "}
              {project.missingSetupCount === 1 ? "step" : "steps"} missing
            </p>
          ) : null}
          {!project.hasActiveAdministrator ? (
            <StatusBadge label="No active administrator" tone="attention" />
          ) : null}
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link
              to={workspaceProjectPath(workspaceId, project.id)}
              aria-label={`Open project ${project.name}`}
            >
              Open project
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </article>
  );
}
