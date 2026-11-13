import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { FormDialog } from "@/components/FormDialog";
import { ReasonField } from "@/components/ReasonField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  projectWriteMutation,
  orphanedProjectsQuery,
  type ProjectScope,
} from "@/features/projects/api/queries";
import type { OrphanedProject } from "@/features/projects/api/types";
import { projectRoleLabel } from "@/features/projects/model/roleLabels";
import { ApiError } from "@/lib/api/apiError";
const schema = z.object({
  participantId: z.string().min(1, "Choose a team member."),
  reason: z
    .string()
    .trim()
    .min(1, "Enter a reason.")
    .max(2000, "Use 2,000 characters or fewer."),
});
export function AppointAdministratorDialog({
  scope,
  project,
  onSuccess,
}: {
  scope: ProjectScope;
  project: OrphanedProject;
  onSuccess: (message: string) => void;
}) {
  const client = useQueryClient(),
    mutation = useMutation(projectWriteMutation(scope, project.id));
  if (!project.candidates.length)
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Appoint administrator</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Appoint administrator — {project.name}</DialogTitle>
            <DialogDescription>
              No team member is left to appoint. The project stays without an
              administrator.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    );
  return (
    <FormDialog
      title={`Appoint administrator — ${project.name}`}
      schema={schema}
      defaultValues={{ participantId: "", reason: "" }}
      submitLabel="Appoint administrator"
      submitDisabled={project.candidates.length === 0}
      trigger={<Button variant="outline">Appoint administrator</Button>}
      onReload={async () => {
        await client.query({ ...orphanedProjectsQuery(scope), staleTime: 0 });
        return { participantId: "", reason: "" };
      }}
      errorPresentation={(error) =>
        error instanceof ApiError && error.kind === "conflict" ? (
          <p role="alert">
            This project has an administrator again. No change was made.
          </p>
        ) : null
      }
      onSubmit={async (values) => {
        const candidate = project.candidates.find(
          (row) => row.participantId === values.participantId,
        );
        if (!candidate)
          throw new ApiError("validation", "Choose a team member.");
        await mutation.mutateAsync({
          action: "appointAdministrator",
          request: {
            participantId: values.participantId,
            reason: values.reason,
          },
        });
        await client.invalidateQueries({
          queryKey: orphanedProjectsQuery(scope).queryKey,
        });
        onSuccess(
          `${candidate.displayName?.trim() || "Name unavailable"} is now an administrator of ${project.name}.`,
        );
        return "done";
      }}
    >
      {(form) =>
        project.candidates.length ? (
          <>
            <div className="flex flex-col gap-2">
              <Label htmlFor="recovery-member">Member participant</Label>
              <Select
                value={form.watch("participantId")}
                onValueChange={(value) => {
                  form.setValue("participantId", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
              >
                <SelectTrigger
                  id="recovery-member"
                  aria-invalid={!!form.formState.errors.participantId}
                >
                  <SelectValue placeholder="Select a team member" />
                </SelectTrigger>
                <SelectContent>
                  {project.candidates.map((row) => (
                    <SelectItem
                      key={row.participantId}
                      value={row.participantId}
                    >
                      {row.displayName?.trim() || "Name unavailable"} (
                      {row.roles.map(projectRoleLabel).join(", ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.participantId ? (
                <p role="alert">
                  {form.formState.errors.participantId.message}
                </p>
              ) : null}
            </div>
            <ReasonField
              id="recovery-reason"
              required
              value={form.watch("reason")}
              error={form.formState.errors.reason?.message}
              {...form.register("reason")}
            />
          </>
        ) : (
          <p>
            No team member is left to appoint. The project stays without an
            administrator.
          </p>
        )
      }
    </FormDialog>
  );
}
