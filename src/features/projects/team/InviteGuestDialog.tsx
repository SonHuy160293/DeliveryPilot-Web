import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { FormField } from "@/components/FormField";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROJECT_ROLE_LABELS } from "@/features/projects/model/roleLabels";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { teamActionFeedback } from "@/features/projects/team/TeamActionFeedback";
const guestRoles = [
  "ProjectManager",
  "BusinessAnalyst",
  "Developer",
  "QualityAssurance",
  "DevOps",
  "Viewer",
] as const;
const schema = z.object({
  recipientEmail: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter an email address.")
    .max(320, "Use 320 characters or fewer.")
    .pipe(z.email("Enter a valid email address.")),
  offeredRoleCode: z.enum(guestRoles),
});
export function InviteGuestDialog({
  actions,
}: {
  actions: ProjectTeamActions;
}) {
  return (
    <FormDialog
      title="Invite guest"
      description="Invite a guest to this project."
      trigger={<Button variant="outline">Invite guest</Button>}
      submitLabel="Invite guest"
      schema={schema}
      defaultValues={{ recipientEmail: "", offeredRoleCode: "Viewer" }}
      submitDisabled={actions.blocked}
      errorPresentation={teamActionFeedback}
      onOpenChange={(open) => {
        if (open) actions.reset();
      }}
      onSubmit={(values) =>
        actions.run(
          { action: "inviteGuest", request: values },
          `Invitation sent to ${values.recipientEmail}. It expires in 7 days.`,
        )
      }
    >
      {(form) => (
        <>
          <FormField
            id="guest-email"
            label="Email"
            type="email"
            required
            error={form.formState.errors.recipientEmail?.message}
            {...form.register("recipientEmail")}
          />
          <div className="flex flex-col gap-2">
            <Label htmlFor="guest-role">Role</Label>
            <Select
              value={form.watch("offeredRoleCode")}
              disabled={form.formState.isSubmitting}
              onValueChange={(value) => {
                const parsed = schema.shape.offeredRoleCode.safeParse(value);
                if (parsed.success)
                  form.setValue("offeredRoleCode", parsed.data, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
              }}
            >
              <SelectTrigger id="guest-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {guestRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {PROJECT_ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </FormDialog>
  );
}
