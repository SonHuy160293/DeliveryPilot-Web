import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDialogSnapshot } from "@/features/engagements/model/useDialogSnapshot";
import type {
  EngagementDetail,
  EngagementContact,
} from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(200, "Use 200 characters or fewer."),
  email: z.string().trim().pipe(z.email("Enter a valid email address.")),
  contactRole: z.enum(["ClientProductOwner", "Sponsor", "Other"]),
});
function values(row?: EngagementContact) {
  return {
    name: row?.name ?? "",
    email: row?.email ?? "",
    contactRole: row?.contactRole ?? "Other",
  };
}
export function ContactDialog({
  engagement,
  contact,
  actions,
}: {
  engagement: EngagementDetail;
  contact?: EngagementContact;
  actions: EngagementActions;
}) {
  const dialog = useDialogSnapshot(engagement, actions),
    target = dialog.snapshot.contacts.find((row) => row.id === contact?.id),
    previous = dialog.snapshot.contacts.find(
      (row) =>
        row.contactRole === "ClientProductOwner" && row.id !== contact?.id,
    );
  return (
    <FormDialog
      title={contact ? `Edit contact: ${contact.name}` : "Add contact"}
      submitLabel="Save contact"
      schema={schema}
      defaultValues={values(target)}
      trigger={
        <Button variant="outline">{contact ? "Edit" : "Add contact"}</Button>
      }
      onOpenChange={dialog.onOpenChange}
      submitDisabled={dialog.snapshot.status !== "Active"}
      onReload={async () => {
        const latest = await dialog.reload();
        return values(latest.contacts.find((row) => row.id === contact?.id));
      }}
      onSubmit={(input) =>
        actions.run(
          {
            action: "upsertContact",
            contactId: contact?.id ?? null,
            request: { ...input, expectedVersion: dialog.snapshot.version },
          },
          "Contact saved.",
        )
      }
    >
      {(form) => (
        <>
          <FormField
            id="contact-name"
            label="Name"
            required
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
          <FormField
            id="contact-email"
            label="Email"
            type="email"
            required
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact-role">Contact role</Label>
            <Select
              value={form.watch("contactRole")}
              onValueChange={(value) => {
                const parsed = schema.shape.contactRole.safeParse(value);
                if (parsed.success)
                  form.setValue("contactRole", parsed.data, {
                    shouldDirty: true,
                  });
              }}
            >
              <SelectTrigger id="contact-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ClientProductOwner">
                  Client Product Owner
                </SelectItem>
                <SelectItem value="Sponsor">Sponsor</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.watch("contactRole") === "ClientProductOwner" && previous ? (
            <p>This replaces {previous.name} as client Product Owner.</p>
          ) : null}
        </>
      )}
    </FormDialog>
  );
}
