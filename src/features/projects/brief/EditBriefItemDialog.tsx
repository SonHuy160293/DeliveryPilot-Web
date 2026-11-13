import { useState } from "react";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { TextareaField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { ApiFeedback } from "@/components/ApiFeedback";
import { ApiError } from "@/lib/api/apiError";
import { formatCount } from "@/lib/format";
import type {
  ProjectBrief,
  UpdateBriefItemRequest,
} from "@/features/projects/api/types";
import type { ProjectBriefActions } from "@/features/projects/model/useProjectBriefActions";
import { isBriefWritten } from "@/features/projects/model/briefItems";
const schema = z.object({
  value: z.string().trim().max(4000, "Use 4,000 characters or fewer."),
});
export function EditBriefItemDialog({
  item,
  label,
  field,
  brief,
  canEdit,
  actions,
}: {
  item: UpdateBriefItemRequest["item"];
  label: string;
  field:
    | "problem"
    | "objectivesAndSuccessCriteria"
    | "scopeAndExclusions"
    | "assumptions"
    | "constraintsAndDependencies"
    | "openQuestions"
    | "productGoal";
  brief: ProjectBrief;
  canEdit: boolean;
  actions: ProjectBriefActions;
}) {
  const [snapshot, setSnapshot] = useState(brief),
    [reloadPermission, setReloadPermission] = useState(true);
  const writable = canEdit && reloadPermission;
  const verb = isBriefWritten(brief[field]) ? "Edit" : "Add";
  const id = `brief-${item}`;
  return (
    <div hidden={!canEdit} className={!canEdit ? "hidden" : undefined}>
      <FormDialog
        title={`${verb} ${label}`}
        submitLabel="Save"
        schema={schema}
        defaultValues={{ value: snapshot[field] ?? "" }}
        trigger={
          <Button variant="outline" size="sm" aria-label={`${verb} ${label}`}>
            {verb}
          </Button>
        }
        submitDisabled={!writable}
        onOpenChange={(open) => {
          if (open) {
            setSnapshot(brief);
            setReloadPermission(canEdit);
          }
        }}
        onReload={async () => {
          const result = await actions.reload();
          setSnapshot(result.brief);
          setReloadPermission(result.canEdit);
          return { value: result.brief[field] ?? "" };
        }}
        onSubmit={(values) =>
          actions.save({
            item,
            expectedVersion: snapshot.version,
            value: values.value || null,
          })
        }
      >
        {(form) => (
          <div className="flex min-w-0 flex-col gap-2">
            {!writable ? (
              <ApiFeedback
                error={new ApiError("forbidden", "Editing unavailable")}
              />
            ) : null}
            <TextareaField
              id={id}
              label={label}
              readOnly={!writable}
              className="min-h-48"
              error={form.formState.errors.value?.message}
              {...form.register("value")}
              aria-describedby={`${id}-count${form.formState.errors.value ? ` ${id}-error` : ""}`}
            />
            <p id={`${id}-count`} className="text-xs text-muted-foreground">
              {formatCount(form.watch("value").length)} / 4,000
            </p>
          </div>
        )}
      </FormDialog>
    </div>
  );
}
