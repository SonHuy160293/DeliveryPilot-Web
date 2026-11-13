import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FilterBar } from "@/components/FilterBar";
import { ReadState } from "@/components/ReadState";
import { SectionHeading } from "@/components/SectionHeading";
import {
  projectStakeholdersQuery,
  projectParticipantsQuery,
  type ProjectScope,
} from "@/features/projects/api/queries";
import type { ProjectDetail } from "@/features/projects/api/types";
import type { ProjectShareBadgeComponent } from "@/features/projects/brief/shareTypes";
import { useStakeholderActions } from "@/features/projects/model/useStakeholderActions";
import { isProjectUnavailable } from "@/features/projects/model/useProjectUnavailable";
import { StakeholderDialog } from "@/features/projects/stakeholders/StakeholderDialog";
import { StakeholderTable } from "@/features/projects/stakeholders/StakeholderTable";
import { formatCount } from "@/lib/format";
export function ProjectStakeholdersTab({
  scope,
  project,
  onSuccess,
  onUnavailable,
  ShareBadgeComponent,
}: {
  scope: ProjectScope;
  project: ProjectDetail;
  onSuccess: (message: string) => void;
  onUnavailable: (error: unknown) => void;
  ShareBadgeComponent?: ProjectShareBadgeComponent;
}) {
  const [showRetired, setShowRetired] = useState(false),
    [side, setSide] = useState("All");
  const retiredControl = useRef<HTMLButtonElement>(null);
  const options = projectStakeholdersQuery(scope, project.id, showRetired),
    query = useQuery(options),
    participants = useQuery(projectParticipantsQuery(scope, project.id));
  const actions = useStakeholderActions(
      scope,
      project.id,
      onSuccess,
      onUnavailable,
    ),
    error = query.error ?? participants.error;
  useEffect(() => {
    if (isProjectUnavailable(error)) onUnavailable(error);
  }, [error, onUnavailable]);
  const rows = (query.data ?? []).filter(
    (row) => side === "All" || row.side === side,
  );
  return (
    <section
      aria-label="Stakeholder register"
      className="flex min-w-0 flex-col gap-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeading
          title={`Stakeholders (${formatCount(rows.length)})`}
          description="Stakeholder entries are a record only. They don't give anyone access."
        />
        {project.permissions.editStakeholders && participants.data && !error ? (
          <StakeholderDialog
            participants={participants.data}
            actions={actions}
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <FilterBar
          filters={[
            {
              id: "stakeholder-side-filter",
              label: "Side",
              value: side,
              options: ["All", "Vendor", "Client"].map((value) => ({
                value,
                label: value,
              })),
              onChange: setSide,
            },
          ]}
          onReset={() => {
            setSide("All");
          }}
        />
        <div className="flex items-center gap-2 py-3">
          <Checkbox
            ref={retiredControl}
            id="stakeholders-retired"
            checked={showRetired}
            onCheckedChange={(value) => {
              setShowRetired(value === true);
            }}
          />
          <Label htmlFor="stakeholders-retired">Show retired</Label>
        </div>
      </div>
      <ReadState
        query={{
          ...query,
          isPending: query.isPending || participants.isPending,
          error,
          data: query.data && participants.data,
          refetch: () => {
            void query.refetch();
            void participants.refetch();
          },
        }}
        queryKey={options.queryKey}
        scope="Stakeholders"
        empty={!rows.length}
        emptyTitle="No stakeholders recorded"
        emptyDescription="Add the people who make or influence decisions on this project."
      >
        <StakeholderTable
          onRetired={() => {
            retiredControl.current?.focus();
          }}
          rows={rows}
          participants={participants.data ?? []}
          project={project}
          scope={scope}
          actions={actions}
          ShareBadgeComponent={ShareBadgeComponent}
        />
      </ReadState>
    </section>
  );
}
