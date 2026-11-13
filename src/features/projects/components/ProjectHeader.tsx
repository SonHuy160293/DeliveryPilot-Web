import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { statusTone } from "@/lib/statusTone";
import {
  ROUTES,
  workspaceOverviewPath,
  workspaceProjectsPath,
} from "@/lib/routes";
import { projectRoleLabel } from "@/features/projects/model/roleLabels";
import type { ProjectDetail } from "@/features/projects/api/types";
export function ProjectHeader({
  project,
  workspaceId,
  workspaceName,
}: {
  project: ProjectDetail;
  workspaceId: string;
  workspaceName: string;
}) {
  return (
    <header className="flex min-w-0 flex-col gap-3 break-words">
      <PageHeader
        title={project.name}
        description={project.purpose}
        breadcrumbs={[
          { label: "Workspaces", to: ROUTES.workspaces },
          { label: workspaceName, to: workspaceOverviewPath(workspaceId) },
          { label: "Projects", to: workspaceProjectsPath(workspaceId) },
          { label: project.name },
        ]}
      />
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge label={project.status} tone={statusTone(project.status)} />
        <span className="text-sm text-muted-foreground">
          {project.kind === "Client" ? "Client project" : "Internal project"}
        </span>
        <div
          role="group"
          aria-label="Your roles"
          className="flex flex-wrap gap-2"
        >
          {project.myRoles.map((role) => (
            <Badge key={role} variant="secondary">
              {projectRoleLabel(role)}
            </Badge>
          ))}
        </div>
      </div>
    </header>
  );
}
