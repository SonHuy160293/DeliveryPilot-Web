import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCount, formatInstant } from "@/lib/format";
import type { ProjectBrief } from "@/features/projects/api/types";
import type { ProjectBriefActions } from "@/features/projects/model/useProjectBriefActions";
import { isBriefWritten } from "@/features/projects/model/briefItems";
import { EditBriefItemDialog } from "@/features/projects/brief/EditBriefItemDialog";
export function ProductGoalCard({
  brief,
  canEdit,
  actions,
  people,
}: {
  brief: ProjectBrief;
  canEdit: boolean;
  actions: ProjectBriefActions;
  people: Readonly<Record<string, string>>;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <section aria-labelledby="product-goal-heading">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <CardTitle>
              <h3 id="product-goal-heading" className="text-lg">
                Product Goal
              </h3>
            </CardTitle>
            <EditBriefItemDialog
              item="ProductGoal"
              label="Product Goal"
              field="productGoal"
              brief={brief}
              canEdit={canEdit}
              actions={actions}
            />
          </div>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4">
          <p
            className={
              isBriefWritten(brief.productGoal)
                ? "whitespace-pre-line break-words"
                : "text-muted-foreground"
            }
          >
            {isBriefWritten(brief.productGoal)
              ? brief.productGoal
              : "Not yet written"}
          </p>
          {brief.previousProductGoals.length ? (
            <div className="flex min-w-0 flex-col gap-3">
              <Button
                variant="ghost"
                className="self-start whitespace-normal text-left"
                aria-expanded={expanded}
                aria-controls="earlier-product-goals"
                onClick={() => {
                  setExpanded((value) => !value);
                }}
              >
                Earlier Product Goals (
                {formatCount(brief.previousProductGoals.length)})
              </Button>
              {expanded ? (
                <ol
                  id="earlier-product-goals"
                  className="flex min-w-0 flex-col gap-4"
                >
                  {brief.previousProductGoals.map((goal, index) => (
                    <li
                      key={`${goal.replacedAt}:${String(index)}`}
                      className="flex min-w-0 flex-col gap-2"
                    >
                      <p className="whitespace-pre-line break-words">
                        {goal.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <time dateTime={goal.replacedAt}>
                          {formatInstant(goal.replacedAt)}
                        </time>{" "}
                        by {people[goal.replacedByUserId] ?? "Name unavailable"}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
