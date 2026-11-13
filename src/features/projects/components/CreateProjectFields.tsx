import { useContext } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { FormField, TextareaField } from "@/components/FormField";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { FormReadOnlyContext } from "@/lib/formReadOnly";
import { formatCount } from "@/lib/format";
import type { CreateProjectValues } from "@/features/projects/model/createForm";
import type { ProjectEngagementRef } from "@/features/projects/api/types";
import { EngagementSelect } from "@/features/projects/components/EngagementSelect";
export function CreateProjectFields({
  form,
  engagements,
  uncertain,
}: {
  form: UseFormReturn<CreateProjectValues>;
  engagements: readonly ProjectEngagementRef[];
  uncertain: boolean;
}) {
  const pending = useContext(FormReadOnlyContext),
    readOnly = uncertain || pending,
    errors = form.formState.errors;
  return (
    <>
      <FormField
        id="prj-name"
        label="Project name"
        required
        readOnly={readOnly}
        error={errors.name?.message}
        {...form.register("name")}
      />
      <div className="flex flex-col gap-2">
        <TextareaField
          id="prj-purpose"
          label="Purpose"
          required
          readOnly={readOnly}
          error={errors.purpose?.message}
          {...form.register("purpose")}
          aria-describedby={`prj-purpose-count${errors.purpose ? " prj-purpose-error" : ""}`}
        />
        <p id="prj-purpose-count" className="text-xs text-muted-foreground">
          {formatCount(form.watch("purpose").length)} / 500
        </p>
      </div>
      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="mb-3 text-sm font-medium">Project type</legend>
        <Label htmlFor="prj-kind" className="sr-only">
          Project type
        </Label>
        <Controller
          name="kind"
          control={form.control}
          render={({ field }) => (
            <Select
              value={field.value}
              disabled={readOnly}
              onValueChange={field.onChange}
            >
              <SelectTrigger
                id="prj-kind"
                onBlur={field.onBlur}
                className="w-full"
                aria-describedby={
                  !engagements.length ? "prj-kind-help" : undefined
                }
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="Client" disabled={!engagements.length}>
                    Client project
                  </SelectItem>
                  <SelectItem value="Internal">Internal project</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        />
        {!engagements.length ? (
          <p id="prj-kind-help" className="text-sm text-muted-foreground">
            You need engagement read access to create a client project. Create
            an internal project or ask an Admin.
          </p>
        ) : null}
      </fieldset>
      {form.watch("kind") === "Client" ? (
        <Controller
          name="engagementId"
          control={form.control}
          render={({ field }) => (
            <EngagementSelect
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              engagements={engagements}
              disabled={readOnly}
              error={errors.engagementId?.message}
            />
          )}
        />
      ) : null}
      <p className="text-sm text-muted-foreground">
        Framework: Scrum. Sprint length starts at 2 weeks; you can change it
        later.
      </p>
    </>
  );
}
