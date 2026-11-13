import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { FormField, TextareaField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  portalWriteMutation,
  portalKey,
  guestProjectViewQuery,
  type PortalScope,
} from "@/features/portal/api/queries";
import type { GuestProjectView } from "@/features/portal/api/types";
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(200, "Use 200 characters or fewer."),
  side: z.enum(["Vendor", "Client"]),
  organizationName: z.string().trim().max(200),
  responsibilities: z.string().trim().max(2000),
  decisionAreas: z.string().trim().max(2000),
});
export function GuestStakeholders({
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
    versions = useRef<Record<string, number>>({});
  if (!view.roleAccess.editStakeholders || !view.editableStakeholders)
    return null;
  return (
    <section aria-label="Stakeholders" className="space-y-4">
      <h2 className="text-xl font-semibold">Stakeholders</h2>
      {view.editableStakeholders.map((row) => (
        <div key={row.id} className="space-y-2">
          <h3 className="font-semibold">{row.name}</h3>
          <p>
            {row.side}
            {row.organizationName ? ` · ${row.organizationName}` : ""}
          </p>
          <FormDialog
            title={`Edit stakeholder: ${row.name}`}
            submitLabel="Save stakeholder"
            schema={schema}
            defaultValues={{
              name: row.name,
              side: row.side,
              organizationName: row.organizationName ?? "",
              responsibilities: row.responsibilities ?? "",
              decisionAreas: row.decisionAreas ?? "",
            }}
            trigger={<Button variant="outline">Edit</Button>}
            onOpenChange={(open) => {
              if (open) versions.current[row.id] = row.version;
            }}
            onReload={async () => {
              const latest = await client.query({
                ...guestProjectViewQuery(scope, view.projectId),
                staleTime: 0,
              });
              const target = latest.editableStakeholders?.find(
                (item) => item.id === row.id,
              );
              if (!target || !latest.roleAccess.editStakeholders)
                throw new Error("Stakeholder unavailable");
              versions.current[row.id] = target.version;
              return {
                name: target.name,
                side: target.side,
                organizationName: target.organizationName ?? "",
                responsibilities: target.responsibilities ?? "",
                decisionAreas: target.decisionAreas ?? "",
              };
            }}
            onSubmit={async (values) => {
              await mutation.mutateAsync({
                action: "stakeholder",
                stakeholderId: row.id,
                request: {
                  ...values,
                  organizationName: values.organizationName || null,
                  responsibilities: values.responsibilities || null,
                  decisionAreas: values.decisionAreas || null,
                  version: versions.current[row.id] ?? row.version,
                },
              });
              await client.invalidateQueries({ queryKey: portalKey(scope) });
              onSuccess("Stakeholder saved.");
              return "done";
            }}
          >
            {(form) => (
              <>
                <FormField
                  id={`guest-stakeholder-name-${row.id}`}
                  label="Name"
                  required
                  error={form.formState.errors.name?.message}
                  {...form.register("name")}
                />
                <Label htmlFor={`guest-stakeholder-side-${row.id}`}>Side</Label>
                <Select
                  value={form.watch("side")}
                  onValueChange={(value) => {
                    const parsed = schema.shape.side.safeParse(value);
                    if (parsed.success)
                      form.setValue("side", parsed.data, { shouldDirty: true });
                  }}
                >
                  <SelectTrigger id={`guest-stakeholder-side-${row.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Vendor">Vendor</SelectItem>
                    <SelectItem value="Client">Client</SelectItem>
                  </SelectContent>
                </Select>
                <FormField
                  id={`guest-stakeholder-organization-${row.id}`}
                  label="Organization"
                  readOnly={form.watch("side") === "Vendor"}
                  error={form.formState.errors.organizationName?.message}
                  {...form.register("organizationName")}
                />
                <TextareaField
                  id={`guest-stakeholder-responsibilities-${row.id}`}
                  label="Responsibilities"
                  error={form.formState.errors.responsibilities?.message}
                  {...form.register("responsibilities")}
                />
                <TextareaField
                  id={`guest-stakeholder-decisions-${row.id}`}
                  label="Decision areas"
                  error={form.formState.errors.decisionAreas?.message}
                  {...form.register("decisionAreas")}
                />
              </>
            )}
          </FormDialog>
        </div>
      ))}
    </section>
  );
}
