import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PersonCell } from "@/components/PersonCell";
import { formatDate } from "@/lib/format";
import type { Participant, ProjectDetail } from "@/features/projects/api/types";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { AssignClientPoDialog } from "@/features/projects/team/AssignClientPoDialog";
import { TeamConfirmAction } from "@/features/projects/team/TeamConfirmAction";
export function ClientPoCard({
  project,
  participants,
  defaults,
  actions,
}: {
  project: ProjectDetail;
  participants: Participant[];
  defaults: readonly string[];
  actions: ProjectTeamActions;
}) {
  if (project.kind !== "Client") return null;
  const assignment = project.clientProductOwner,
    guests = participants.filter(
      (item) => item.kind === "Guest" && item.status === "Active",
    );
  return (
    <section aria-label="Client Product Owner">
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Client Product Owner</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {assignment ? (
            <>
              <PersonCell
                userId={assignment.userId}
                displayName={assignment.displayName}
                secondary={`Guest · assigned ${formatDate(assignment.assignedAt.slice(0, 10))}`}
              />
              {defaults.includes(assignment.participantId) ? (
                <Badge variant="outline">Engagement default</Badge>
              ) : null}
            </>
          ) : (
            <p>No client Product Owner assigned.</p>
          )}
          {project.permissions.assignClientPo ? (
            <div className="flex flex-wrap gap-3">
              <AssignClientPoDialog
                project={project}
                guests={guests}
                defaults={defaults}
                actions={actions}
              />
              {assignment ? (
                <TeamConfirmAction
                  label="Remove client PO"
                  target={assignment.displayName?.trim() || "Name unavailable"}
                  consequence="Remove the client Product Owner assignment."
                  actions={actions}
                  request={() => ({
                    action: "assignClientPo",
                    participantId: null,
                    expectedVersion: project.version,
                  })}
                  success="Client Product Owner removed."
                />
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
