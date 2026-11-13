import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { ReadState } from "@/components/ReadState";
import { MockDataBanner } from "@/components/MockDataBanner";
import { Button } from "@/components/ui/button";
import { ProjectGrid } from "@/features/projects/components/ProjectGrid";
import { ProjectFilters } from "@/features/projects/components/ProjectFilters";
import { CreateProjectDialog } from "@/features/projects/components/CreateProjectDialog";
import { ProjectsReadError } from "@/features/projects/components/ProjectsReadError";
import {
  myProjectsQuery,
  projectCreationOptionsQuery,
  projectRepositoryKind,
  type ProjectScope,
} from "@/features/projects/api/queries";
import { useProjectFilters } from "@/features/projects/model/useProjectFilters";
import {
  ROUTES,
  workspaceOverviewPath,
  workspaceProjectPath,
} from "@/lib/routes";
export function ProjectsView({
  scope,
  workspaceName,
}: {
  scope: ProjectScope;
  workspaceName: string;
}) {
  const listOptions = myProjectsQuery(scope),
    list = useQuery(listOptions),
    creation = useQuery(projectCreationOptionsQuery(scope));
  const [params, setParams] = useSearchParams(),
    navigate = useNavigate();
  const {
    search,
    setSearch,
    status,
    setStatus,
    kind,
    setKind,
    rows,
    filtered,
    clearFilters,
  } = useProjectFilters(list.data ?? []);
  const [manualOpen, setManualOpen] = useState(false);
  function changeOpen(open: boolean) {
    setManualOpen(open);
    if (!open && params.get("create") === "1")
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.delete("create");
          next.delete("engagementId");
          return next;
        },
        { replace: true },
      );
  }
  const canCreate = creation.isSuccess && creation.data.create,
    mock = projectRepositoryKind() === "mock";
  return (
    <div className="flex min-w-0 flex-col gap-8 break-words">
      <PageHeader
        title="Projects"
        description="Projects you take part in. Other projects in this workspace are not shown."
        breadcrumbs={[
          { label: "Workspaces", to: ROUTES.workspaces },
          {
            label: workspaceName,
            to: workspaceOverviewPath(scope.workspaceId),
          },
          { label: "Projects" },
        ]}
        action={
          canCreate ? (
            <CreateProjectDialog
              scope={scope}
              engagements={creation.data.engagements}
              defaultEngagementId={params.get("engagementId") ?? undefined}
              open={manualOpen || params.get("create") === "1"}
              onOpenChange={changeOpen}
              onCreated={(project) => {
                void navigate(
                  workspaceProjectPath(scope.workspaceId, project.id) +
                    "?tab=overview",
                  {
                    state: {
                      projectCreated: true,
                      projectId: project.id,
                      mock,
                      message:
                        "Project created. You are its project administrator.",
                    },
                  },
                );
              }}
            />
          ) : undefined
        }
      />
      {mock ? <MockDataBanner /> : null}
      <ProjectFilters
        search={search}
        status={status}
        kind={kind}
        setSearch={setSearch}
        setStatus={setStatus}
        setKind={setKind}
        count={rows.length}
        onReset={clearFilters}
      />
      {creation.error ? (
        <ProjectsReadError
          error={creation.error}
          pending={creation.isFetching}
          retry={() => {
            void creation.refetch();
          }}
        />
      ) : null}
      {list.isPending ? (
        <ProjectGrid projects={[]} workspaceId={scope.workspaceId} loading />
      ) : list.error ? (
        <ProjectsReadError
          error={list.error}
          pending={list.isFetching}
          retry={() => {
            void list.refetch();
          }}
        />
      ) : (
        <ReadState
          query={list}
          queryKey={listOptions.queryKey}
          scope="projects"
          empty={rows.length === 0}
          emptyTitle={
            filtered
              ? "No projects match these filters."
              : "You're not in any project yet"
          }
          emptyDescription={
            filtered
              ? "Clear filters to view available projects."
              : "Projects appear here when you create one or a project admin adds you."
          }
          emptyAction={
            filtered ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Button
                variant="outline"
                onClick={() => {
                  setManualOpen(true);
                }}
              >
                Create project
              </Button>
            ) : undefined
          }
        >
          <ProjectGrid projects={rows} workspaceId={scope.workspaceId} />
        </ReadState>
      )}
    </div>
  );
}
