import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { TextareaField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import {
  portalWriteMutation,
  guestProjectViewQuery,
  portalKey,
  type PortalScope,
} from "@/features/portal/api/queries";
import { briefLabels, briefFields } from "@/features/portal/components/labels";
import type { GuestProjectView } from "@/features/portal/api/types";
import { formatCount } from "@/lib/format";
const schema = z.object({
  value: z.string().trim().max(4000, "Use 4,000 characters or fewer."),
});
export function GuestBriefSection({
  view,
  scope,
  onSuccess,
}: {
  view: GuestProjectView;
  scope: PortalScope;
  onSuccess: (message: string) => void;
}) {
  const client = useQueryClient(),
    mutation = useMutation(portalWriteMutation(scope, view.projectId)),
    brief = view.editableBrief,
    versions = useRef<Record<string, number>>({});
  if (!brief || !view.roleAccess.editBrief) return null;
  return (
    <section aria-label="Brief" className="space-y-4">
      <h2 className="text-xl font-semibold">Brief</h2>
      {Object.entries({
        ...briefFields,
        ProductGoal: "productGoal" as const,
      }).map(([key, field]) => {
        const parsed = z
            .enum([
              "Problem",
              "ObjectivesAndSuccessCriteria",
              "ScopeAndExclusions",
              "Assumptions",
              "ConstraintsAndDependencies",
              "OpenQuestions",
              "ProductGoal",
            ])
            .parse(key),
          label =
            parsed === "ProductGoal" ? "Product Goal" : briefLabels[parsed],
          value = brief[field];
        return (
          <div key={key} className="flex flex-col gap-2">
            <h3 className="font-semibold">{label}</h3>
            <p>{value?.trim() || "Not yet written"}</p>
            <FormDialog
              title={`Edit ${label}`}
              submitLabel="Save"
              schema={schema}
              defaultValues={{ value: value ?? "" }}
              trigger={
                <Button variant="outline" aria-label={`Edit ${label}`}>
                  Edit
                </Button>
              }
              onOpenChange={(open) => {
                if (open) versions.current[key] = brief.version;
              }}
              onReload={async () => {
                const latest = await client.query({
                  ...guestProjectViewQuery(scope, view.projectId),
                  staleTime: 0,
                });
                if (!latest.roleAccess.editBrief || !latest.editableBrief)
                  throw new Error("Editing unavailable");
                versions.current[key] = latest.editableBrief.version;
                return { value: latest.editableBrief[field] ?? "" };
              }}
              onSubmit={async (values) => {
                await mutation.mutateAsync({
                  action: "brief",
                  request: {
                    item: parsed,
                    value: values.value || null,
                    expectedVersion: versions.current[key] ?? brief.version,
                  },
                });
                await client.invalidateQueries({ queryKey: portalKey(scope) });
                onSuccess(
                  parsed === "ProductGoal"
                    ? "Product Goal updated."
                    : "Brief updated.",
                );
                return "done";
              }}
            >
              {(form) => (
                <>
                  <TextareaField
                    id={`guest-brief-${key}`}
                    label={label}
                    error={form.formState.errors.value?.message}
                    {...form.register("value")}
                  />
                  <p className="text-sm text-muted-foreground">
                    {formatCount(form.watch("value").length)} / 4,000
                  </p>
                </>
              )}
            </FormDialog>
          </div>
        );
      })}
    </section>
  );
}
