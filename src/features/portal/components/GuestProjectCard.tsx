import { Link } from "react-router";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { statusTone } from "@/lib/statusTone";
import { formatDate } from "@/lib/format";
import { portalProjectPath } from "@/lib/routes";
import { roles } from "@/features/portal/components/labels";
import type { GuestProjectListItem } from "@/features/portal/api/types";
export function GuestProjectCard({
  project,
}: {
  project: GuestProjectListItem;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="break-words text-lg">{project.name}</h2>
        </CardTitle>
        <StatusBadge label={project.status} tone={statusTone(project.status)} />
      </CardHeader>
      <CardContent className="flex flex-col items-start gap-3">
        <p>Your role {project.myRoles.map((role) => roles[role]).join(", ")}</p>
        {project.isClientProductOwner ? <p>Client Product Owner</p> : null}
        <p>
          Admitted{" "}
          <time dateTime={project.admittedAt}>
            {formatDate(project.admittedAt.slice(0, 10))}
          </time>
        </p>
        <Button asChild>
          <Link to={portalProjectPath(project.projectId)}>Open project</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
