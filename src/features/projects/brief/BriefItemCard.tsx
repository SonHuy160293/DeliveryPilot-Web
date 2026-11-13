import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { ProjectBrief } from "@/features/projects/api/types";
import {
  BRIEF_ITEMS,
  isBriefWritten,
} from "@/features/projects/model/briefItems";
import type { ProjectBriefActions } from "@/features/projects/model/useProjectBriefActions";
import { EditBriefItemDialog } from "@/features/projects/brief/EditBriefItemDialog";
export function BriefItemCard({
  item,
  brief,
  canEdit,
  actions,
  shareState,
}: {
  item: (typeof BRIEF_ITEMS)[number];
  brief: ProjectBrief;
  canEdit: boolean;
  actions: ProjectBriefActions;
  /** Member-only sharing state supplied by the page composition. */
  shareState?: ReactNode;
}) {
  const value = brief[item.field];
  return (
    <section aria-labelledby={`brief-heading-${item.code}`} className="min-w-0">
      <Card className="h-full">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle>
              <h3
                id={`brief-heading-${item.code}`}
                className="break-words text-lg"
              >
                {item.label}
              </h3>
            </CardTitle>
            {shareState}
            <EditBriefItemDialog
              item={item.code}
              label={item.label}
              field={item.field}
              brief={brief}
              canEdit={canEdit}
              actions={actions}
            />
          </div>
        </CardHeader>
        <CardContent>
          <p
            className={
              isBriefWritten(value)
                ? "whitespace-pre-line break-words"
                : "text-muted-foreground"
            }
          >
            {isBriefWritten(value) ? value : "Not yet written"}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
