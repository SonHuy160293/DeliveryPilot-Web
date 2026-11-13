import type { UseFormReturn } from "react-hook-form";
import { FormField, TextareaField } from "@/components/FormField";
import { formatCount } from "@/lib/format";

export interface MilestoneValues {
  name: string;
  description: string;
  targetDate?: string;
}
export function MilestoneFields({
  form,
  adding,
  readOnly,
}: {
  form: UseFormReturn<MilestoneValues>;
  adding: boolean;
  readOnly: boolean;
}) {
  const errors = form.formState.errors;
  return (
    <>
      <div className="flex flex-col gap-2">
        <FormField
          id="milestone-name"
          label="Name"
          required
          readOnly={readOnly}
          error={errors.name?.message}
          {...form.register("name")}
          aria-describedby={`milestone-name-count${errors.name ? " milestone-name-error" : ""}`}
        />
        <p id="milestone-name-count" className="text-xs text-muted-foreground">
          {formatCount(form.watch("name").length)} / 200
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <TextareaField
          id="milestone-description"
          label="Description (optional)"
          readOnly={readOnly}
          error={errors.description?.message}
          {...form.register("description")}
          aria-describedby={`milestone-description-count${errors.description ? " milestone-description-error" : ""}`}
        />
        <p
          id="milestone-description-count"
          className="text-xs text-muted-foreground"
        >
          {formatCount(form.watch("description").length)} / 2,000
        </p>
      </div>
      {adding ? (
        <FormField
          id="milestone-target"
          label="Target date"
          type="date"
          required
          readOnly={readOnly}
          error={errors.targetDate?.message}
          {...form.register("targetDate")}
        />
      ) : null}
    </>
  );
}
