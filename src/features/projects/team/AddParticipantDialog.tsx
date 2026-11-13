import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
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
import { LoadMore } from "@/components/ReadState";
import { ApiFeedback } from "@/components/ApiFeedback";
import type { TeamMembersRead } from "@/features/projects/team/types";
import type { ProjectTeamActions } from "@/features/projects/model/useProjectTeamActions";
import { RoleChecklist } from "@/features/projects/team/RoleChecklist";
import { teamActionFeedback } from "@/features/projects/team/TeamActionFeedback";
const schema = z.object({
  userId: z.string().min(1, "Choose a workspace member."),
  roles: z
    .array(
      z.enum([
        "ProjectAdministrator",
        "ProjectManager",
        "BusinessAnalyst",
        "Developer",
        "QualityAssurance",
        "DevOps",
        "Viewer",
      ]),
    )
    .min(
      1,
      "Choose at least one role. To remove the person, use Remove from project.",
    ),
});
const defaults: z.infer<typeof schema> = { userId: "", roles: [] };
export function AddParticipantDialog({
  members,
  activeUserIds,
  allowAdministrator,
  actions,
}: {
  members: TeamMembersRead;
  activeUserIds: readonly string[];
  allowAdministrator: boolean;
  actions: ProjectTeamActions;
}) {
  const options = members.items.filter(
    (member) => !activeUserIds.includes(member.userId),
  );
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {members.denied ? (
        <p className="text-sm text-muted-foreground">
          You don't have permission to view workspace members. Ask a workspace
          administrator to add team members.
        </p>
      ) : members.loading ? (
        <p role="status">Loading workspace members…</p>
      ) : members.error ? (
        <>
          <ApiFeedback error={members.error} />
          <Button variant="outline" onClick={members.retry}>
            Retry loading workspace members
          </Button>
        </>
      ) : null}
      <FormDialog
        title="Add team member"
        description="Choose an active workspace member and their project roles."
        trigger={
          <Button
            variant="outline"
            disabled={members.loading || members.denied || !!members.error}
          >
            Add team member
          </Button>
        }
        submitLabel="Add team member"
        schema={schema}
        defaultValues={defaults}
        errorPresentation={teamActionFeedback}
        submitDisabled={members.denied || !!members.error || members.loading}
        onOpenChange={(open) => {
          if (open) actions.reset();
        }}
        onSubmit={(values) =>
          actions.run(
            { action: "addParticipant", request: values },
            `${options.find((member) => member.userId === values.userId)?.displayName.trim() || "Name unavailable"} added to the team.`,
          )
        }
      >
        {(form) => (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="project-member">Member</Label>
              <Select
                value={form.watch("userId")}
                disabled={form.formState.isSubmitting}
                onValueChange={(value) => {
                  form.setValue("userId", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger
                  id="project-member"
                  aria-invalid={!!form.formState.errors.userId}
                  aria-describedby={
                    form.formState.errors.userId
                      ? "project-member-error"
                      : undefined
                  }
                  onBlur={() => {
                    void form.trigger("userId");
                  }}
                >
                  <SelectValue placeholder="Choose a workspace member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {options.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.displayName.trim() || "Name unavailable"} ·{" "}
                        {member.primaryEmail}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {form.formState.errors.userId ? (
                <p
                  id="project-member-error"
                  role="alert"
                  className="text-sm text-destructive"
                >
                  {form.formState.errors.userId.message}
                </p>
              ) : null}
            </div>
            {!options.length ? (
              <p className="text-sm text-muted-foreground">
                No other workspace members available.
              </p>
            ) : null}
            <LoadMore
              more={members.more}
              pending={members.fetching}
              load={members.loadMore}
            />
            <RoleChecklist
              onBlur={() => {
                void form.trigger("roles");
              }}
              value={form.watch("roles")}
              onChange={(roles) => {
                form.setValue("roles", roles, {
                  shouldDirty: true,
                  shouldValidate:
                    form.formState.isSubmitted || !!form.formState.errors.roles,
                });
              }}
              allowAdministrator={allowAdministrator}
              forGuest={false}
              disabled={form.formState.isSubmitting}
              error={form.formState.errors.roles?.message}
            />
          </>
        )}
      </FormDialog>
    </div>
  );
}
