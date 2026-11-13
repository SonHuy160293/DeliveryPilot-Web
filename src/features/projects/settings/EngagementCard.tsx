import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ProjectDetail } from "@/features/projects/api/types";
import type { ProjectScope } from "@/features/projects/api/queries";
import type { ProjectSettingsActions } from "@/features/projects/model/useProjectSettingsActions";
import { ChangeEngagementDialog } from "@/features/projects/settings/ChangeEngagementDialog";
export function EngagementCard({
  scope,
  project,
  actions,
}: {
  scope: ProjectScope;
  project: ProjectDetail;
  actions: ProjectSettingsActions;
}) {
  return (
    <section aria-label="Engagement">
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Engagement</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>
            {project.kind === "Client" ? "Client project" : "Internal project"}
            {project.engagement
              ? ` · ${project.engagement.clientDisplayName} — ${project.engagement.engagementName ?? "Not named"} (${project.engagement.agreementReference})`
              : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            Fixed once the project is active.
          </p>
          {project.status === "Draft" &&
          project.permissions.changeEngagement ? (
            <ChangeEngagementDialog
              scope={scope}
              project={project}
              actions={actions}
            />
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
