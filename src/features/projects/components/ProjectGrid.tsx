import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/features/projects/components/ProjectCard";
import type { ProjectListItem } from "@/features/projects/api/types";
export function ProjectGrid({
  projects,
  workspaceId,
  loading = false,
}: {
  projects: readonly ProjectListItem[];
  workspaceId: string;
  loading?: boolean;
}) {
  if (loading)
    return (
      <div
        role="status"
        aria-busy="true"
        className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3"
      >
        <span className="sr-only">Loading projects.</span>
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index}>
            <CardContent className="flex flex-col gap-4">
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  return (
    <ul
      aria-label="Projects"
      className="grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      {projects.map((project) => (
        <li key={project.id} className="flex min-w-0 flex-col">
          <ProjectCard project={project} workspaceId={workspaceId} />
        </li>
      ))}
    </ul>
  );
}
