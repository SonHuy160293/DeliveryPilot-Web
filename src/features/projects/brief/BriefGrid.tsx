import { formatCount } from "@/lib/format";
import {
  BRIEF_ITEMS,
  isBriefWritten,
} from "@/features/projects/model/briefItems";
import { BriefItemCard } from "@/features/projects/brief/BriefItemCard";
import type { ProjectBrief } from "@/features/projects/api/types";
import type { ProjectBriefActions } from "@/features/projects/model/useProjectBriefActions";
import type { ProjectShareBadgeComponent } from "@/features/projects/brief/shareTypes";
import type { ProjectScope } from "@/features/projects/api/queries";
export function BriefGrid({
  brief,
  canEdit,
  actions,
  ShareBadgeComponent,
  scope,
  canManageSharing,
}: {
  brief: ProjectBrief;
  canEdit: boolean;
  actions: ProjectBriefActions;
  ShareBadgeComponent?: ProjectShareBadgeComponent;
  scope: ProjectScope;
  canManageSharing: boolean;
}) {
  const written = BRIEF_ITEMS.filter((item) =>
    isBriefWritten(brief[item.field]),
  ).length;
  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      aria-labelledby="project-brief-heading"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <h2 id="project-brief-heading" className="text-xl font-semibold">
          Brief
        </h2>
        <p className="text-sm text-muted-foreground">
          {formatCount(written)} of 6 written
        </p>
      </div>
      <div className="grid min-w-0 gap-6 md:grid-cols-2">
        {BRIEF_ITEMS.map((item) => (
          <BriefItemCard
            key={item.code}
            item={item}
            brief={brief}
            canEdit={canEdit}
            actions={actions}
            shareState={
              ShareBadgeComponent ? (
                <ShareBadgeComponent
                  scope={scope}
                  projectId={brief.projectId}
                  canManage={canManageSharing}
                  item={{ briefItemCode: item.code }}
                />
              ) : undefined
            }
          />
        ))}
      </div>
    </section>
  );
}
