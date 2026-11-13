import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { ReadinessChecklist } from "@/components/ReadinessChecklist";
import { formatInstant } from "@/lib/format";
import { workspaceProjectPath } from "@/lib/routes";
import type {
  ProjectDetail,
  ActivationRejected,
} from "@/features/projects/api/types";
import type { ProjectSettingsActions } from "@/features/projects/model/useProjectSettingsActions";
import { ActivateDialog } from "@/features/projects/settings/ActivateDialog";
import {
  READINESS_LABELS,
  ACTIVATION_CONSEQUENCE,
  type ReadinessGap,
} from "@/features/projects/settings/readinessItems";
export function ActivationCard({
  project,
  workspaceId,
  gaps,
  people,
  actions,
}: {
  project: ProjectDetail;
  workspaceId: string;
  gaps: ActivationRejected["gaps"];
  people: Record<string, string>;
  actions: ProjectSettingsActions;
}) {
  const target = useRef<HTMLElement>(null),
    location = useLocation();
  useEffect(() => {
    if (location.hash === "#activation") {
      target.current?.scrollIntoView({ block: "start" });
      target.current?.focus({ preventScroll: true });
    }
  }, [location.hash]);
  const codes: ReadinessGap[] = [
    "ProductGoal",
    "SprintLength",
    "ProjectManager",
    ...(project.kind === "Client"
      ? (["Engagement", "ClientProductOwnerWaiver"] as const)
      : []),
  ];
  const blocked = gaps.some((gap) => gap !== "ClientProductOwnerWaiver");
  return (
    <section
      ref={target}
      id="activation"
      tabIndex={-1}
      aria-label="Activation"
      className="scroll-mt-16 outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <h3>Activation</h3>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <StatusBadge
            label={project.status}
            tone={project.status === "Draft" ? "neutral" : "active"}
          />
          {project.status === "Active" ? (
            <>
              <p>
                Activated {formatInstant(project.activatedAt)} by{" "}
                {people[project.activatedByUserId ?? ""] ?? "Name unavailable"}
              </p>
              {project.clientPoWaiverReason ? (
                <p className="whitespace-pre-line break-words">
                  Activated without a client Product Owner. Reason:{" "}
                  {project.clientPoWaiverReason}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <ReadinessChecklist
                items={codes.map((id) => ({
                  id,
                  label: READINESS_LABELS[id],
                  done: !gaps.includes(id),
                  missingLabel:
                    id === "ClientProductOwnerWaiver"
                      ? "Missing (can be waived)"
                      : undefined,
                  action:
                    id === "ProjectManager" && gaps.includes(id) ? (
                      <Button
                        variant="link"
                        asChild
                        className="h-auto min-h-6 max-w-full whitespace-normal px-0 py-1 text-left"
                      >
                        <Link
                          to={workspaceProjectPath(
                            workspaceId,
                            project.id,
                            "team",
                          )}
                        >
                          Go to Team
                        </Link>
                      </Button>
                    ) : undefined,
                }))}
              />
              {project.permissions.activate ? (
                <>
                  {blocked ? (
                    <p>Complete every required setup step before activating.</p>
                  ) : null}
                  <ActivateDialog
                    project={project}
                    requiresWaiver={gaps.includes("ClientProductOwnerWaiver")}
                    blocked={blocked}
                    actions={actions}
                  />
                </>
              ) : null}
              <p className="text-sm text-muted-foreground">
                {ACTIVATION_CONSEQUENCE}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
