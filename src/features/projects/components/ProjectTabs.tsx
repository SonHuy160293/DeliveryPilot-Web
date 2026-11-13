import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState } from "@/components/EmptyState";
import {
  PROJECT_TABS,
  PROJECT_TAB_PARAM,
  readProjectTab,
} from "@/lib/projectTabs";
import type { ProjectScope } from "@/features/projects/api/queries";
import type { ProjectDetail } from "@/features/projects/api/types";
import { ProjectOverviewTab } from "@/features/projects/brief/ProjectOverviewTab";
import { ProjectTeamTab } from "@/features/projects/team/ProjectTeamTab";
import type { ProjectTeamComponent } from "@/features/projects/team/types";
import { ProjectSettingsTab } from "@/features/projects/settings/ProjectSettingsTab";
import { ProjectStakeholdersTab } from "@/features/projects/stakeholders/ProjectStakeholdersTab";
import type { ProjectShareBadgeComponent } from "@/features/projects/brief/shareTypes";
export function ProjectTabs({
  scope,
  project,
  onSuccess,
  onUnavailable,
  TeamComponent = ProjectTeamTab,
  SharingComponent,
  ShareBadgeComponent,
}: {
  scope: ProjectScope;
  project: ProjectDetail;
  onSuccess: (message: string) => void;
  onUnavailable: (error: unknown) => void;
  TeamComponent?: ProjectTeamComponent;
  SharingComponent?: ProjectTeamComponent;
  ShareBadgeComponent?: ProjectShareBadgeComponent;
}) {
  const [params, setParams] = useSearchParams();
  const location = useLocation(),
    state: unknown = location.state;
  const visible = PROJECT_TABS.filter(
    (item) =>
      (item.value !== "sharing" ||
        (project.myParticipantKind === "Member" &&
          project.permissions.share)) &&
      (item.value !== "settings" || project.myParticipantKind === "Member"),
  );
  const requested = readProjectTab(params),
    tab = visible.some((item) => item.value === requested)
      ? requested
      : "overview";
  useEffect(() => {
    if (requested !== tab)
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete(PROJECT_TAB_PARAM);
          return next;
        },
        { replace: true, state },
      );
  }, [requested, tab, setParams, state]);
  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        setParams(
          (current) => {
            const updated = new URLSearchParams(current);
            if (next === "overview") updated.delete(PROJECT_TAB_PARAM);
            else updated.set(PROJECT_TAB_PARAM, next);
            return updated;
          },
          { replace: true, state },
        );
      }}
    >
      <div className="min-w-0 overflow-x-auto">
        <TabsList aria-label="Project sections" className="w-max flex-nowrap">
          {visible.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="shrink-0 whitespace-nowrap"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value="overview">
        <ProjectOverviewTab
          ShareBadgeComponent={ShareBadgeComponent}
          scope={scope}
          project={project}
          onSuccess={onSuccess}
          onUnavailable={onUnavailable}
        />
      </TabsContent>
      <TabsContent value="team">
        <TeamComponent
          scope={scope}
          project={project}
          onSuccess={onSuccess}
          onUnavailable={onUnavailable}
        />
      </TabsContent>
      {project.myParticipantKind === "Member" ? (
        <TabsContent value="settings">
          <ProjectSettingsTab
            scope={scope}
            project={project}
            onSuccess={onSuccess}
            onUnavailable={onUnavailable}
          />
        </TabsContent>
      ) : null}
      {visible
        .filter(
          (item) =>
            item.value !== "overview" &&
            item.value !== "team" &&
            item.value !== "settings" &&
            item.value !== "stakeholders",
        )
        .map((item) => (
          <TabsContent key={item.value} value={item.value}>
            {SharingComponent ? (
              <SharingComponent
                scope={scope}
                project={project}
                onSuccess={onSuccess}
                onUnavailable={onUnavailable}
              />
            ) : (
              <div>
                <EmptyState
                  title="Coming soon in this preview"
                  description="This section is not available in this preview."
                />
              </div>
            )}
          </TabsContent>
        ))}
      <TabsContent value="stakeholders">
        <ProjectStakeholdersTab
          scope={scope}
          project={project}
          onSuccess={onSuccess}
          onUnavailable={onUnavailable}
          ShareBadgeComponent={ShareBadgeComponent}
        />
      </TabsContent>
    </Tabs>
  );
}
