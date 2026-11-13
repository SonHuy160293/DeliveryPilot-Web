import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { FormField } from "@/components/FormField";
import { ReasonField } from "@/components/ReasonField";
import { Button } from "@/components/ui/button";
import { createFormSchema } from "@/features/engagements/model/createForm";
import { useDialogSnapshot } from "@/features/engagements/model/useDialogSnapshot";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import type { EngagementDetail } from "@/features/engagements/api/types";
function values(row: EngagementDetail) {
  return {
    clientDisplayName: row.clientDisplayName,
    agreementReference: row.agreementReference,
    agreementSignedOn: row.agreementSignedOn,
    engagementName: row.engagementName ?? "",
    clientLegalName: row.clientLegalName ?? "",
    clientCountryCode: row.clientCountryCode ?? "",
    documentUrl: row.documentUrl ?? "",
    reason: "",
  };
}
const fields = [
  { key: "clientDisplayName", label: "Client display name", required: true },
  { key: "agreementReference", label: "Agreement reference", required: true },
  { key: "agreementSignedOn", label: "Agreement signed on", required: true },
  {
    key: "engagementName",
    label: "Engagement name (optional)",
    required: false,
  },
  {
    key: "clientLegalName",
    label: "Client legal name (optional)",
    required: false,
  },
  {
    key: "clientCountryCode",
    label: "Client country (optional)",
    required: false,
  },
  {
    key: "documentUrl",
    label: "Agreement document link (optional)",
    required: false,
  },
] as const;
export function EditDetailsDialog({
  engagement,
  actions,
}: {
  engagement: EngagementDetail;
  actions: EngagementActions;
}) {
  const dialog = useDialogSnapshot(engagement, actions);
  const schema = createFormSchema
    .and(z.object({ reason: z.string().trim().max(2000) }))
    .superRefine((input, ctx) => {
      if (
        (input.agreementReference !== dialog.snapshot.agreementReference ||
          input.agreementSignedOn !== dialog.snapshot.agreementSignedOn) &&
        !input.reason
      )
        ctx.addIssue({
          code: "custom",
          path: ["reason"],
          message: "Enter a reason.",
        });
    });
  return (
    <FormDialog
      title="Edit details"
      submitLabel="Save details"
      schema={schema}
      defaultValues={values(dialog.snapshot)}
      trigger={<Button variant="outline">Edit details</Button>}
      onOpenChange={dialog.onOpenChange}
      submitDisabled={dialog.snapshot.status !== "Active"}
      onReload={async () => values(await dialog.reload())}
      onSubmit={(input) =>
        actions.run(
          {
            action: "updateDetails",
            request: {
              ...input,
              expectedVersion: dialog.snapshot.version,
              reason: input.reason || null,
            },
          },
          "Engagement details updated.",
        )
      }
    >
      {(form) => (
        <>
          {fields.map((field) => (
            <FormField
              key={field.key}
              id={`edit-details-${field.key}`}
              label={field.label}
              required={field.required}
              type={
                field.key === "agreementSignedOn"
                  ? "date"
                  : field.key === "documentUrl"
                    ? "url"
                    : "text"
              }
              error={form.formState.errors[field.key]?.message}
              {...form.register(field.key)}
            />
          ))}
          <ReasonField
            id="details-reason"
            required={
              form.watch("agreementReference") !==
                dialog.snapshot.agreementReference ||
              form.watch("agreementSignedOn") !==
                dialog.snapshot.agreementSignedOn
            }
            value={form.watch("reason")}
            error={form.formState.errors.reason?.message}
            {...form.register("reason")}
          />
        </>
      )}
    </FormDialog>
  );
}
