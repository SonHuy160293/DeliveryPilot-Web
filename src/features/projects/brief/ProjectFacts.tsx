import { DefinitionList } from "@/components/DefinitionList";
import { formatCount } from "@/lib/format";
import type { ProjectDetail } from "@/features/projects/api/types";
export function ProjectFacts({ project }: { project: ProjectDetail }) {
  return (
    <section
      className="flex flex-col gap-4"
      aria-labelledby="project-facts-heading"
    >
      <h2 id="project-facts-heading" className="text-xl font-semibold">
        Facts
      </h2>
      <DefinitionList
        items={[
          { id: "framework", label: "Framework", value: "Scrum" },
          {
            id: "cadence",
            label: "Sprint length",
            value: `${formatCount(project.sprintLengthWeeks)} ${project.sprintLengthWeeks === 1 ? "week" : "weeks"}`,
          },
          {
            id: "po",
            label: "Client PO",
            value: project.clientProductOwner?.displayName,
          },
        ]}
      />
    </section>
  );
}
