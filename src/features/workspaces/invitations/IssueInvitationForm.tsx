import { useServerFieldErrors } from "@/features/workspaces/model/useServerFieldErrors";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { issueInput, type IssueInput } from "@/features/workspaces/api/inputs";
import type { ScopedOwner } from "@/features/workspaces/api/queries";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { useWorkspaceMutation } from "@/features/workspaces/model/useWorkspaceMutation";
import { useRateLimit } from "@/features/workspaces/model/useRateLimit";
import { RolePicker } from "@/features/workspaces/roles/RolePicker";
import { FormField } from "@/features/workspaces/components/FormField";
import { ApiFeedback } from "@/features/workspaces/components/ApiFeedback";
import { RetryDelay } from "@/features/workspaces/components/RetryDelay";
import type { Invitation } from "@/features/workspaces/api/contracts";

const serverFields = ["recipientEmail", "roleIds"] as const;
export function IssueInvitationForm({
  scope,
  onIssued,
}: {
  scope: ScopedOwner;
  onIssued: (invitation: Invitation) => void;
}) {
  const {
    register,
    setError,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IssueInput>({
    resolver: zodResolver(issueInput),
    mode: "onTouched",
    defaultValues: { recipientEmail: "", roleIds: [] },
  });
  const write = useWorkspaceMutation(
    scope,
    "invitations",
    (input: IssueInput, signal) =>
      workspaceApi.issue(scope, scope.workspaceId, input, signal),
  );
  const rate = useRateLimit(write.error);
  async function submit(values: IssueInput) {
    const result = await write.run(values);
    if (result) onIssued(result);
  }
  useServerFieldErrors(write.error, setError, serverFields);
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit)(event);
      }}
      className="flex flex-col gap-4"
    >
      <h3 className="text-lg font-semibold">Issue an invitation</h3>
      <p className="text-sm text-muted-foreground">
        Issuing queues an email offer. It does not add a member or prove
        delivery.
      </p>
      <FormField
        id="invitation-email"
        label="Recipient email"
        type="email"
        required
        maxLength={320}
        error={errors.recipientEmail?.message}
        {...register("recipientEmail")}
      />
      <Controller
        control={control}
        name="roleIds"
        render={({ field }) => (
          <RolePicker
            scope={scope}
            selected={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            firstRef={field.ref}
            error={errors.roleIds?.message}
          />
        )}
      />
      <ApiFeedback error={write.error} write />
      {rate.blocked ? <RetryDelay delay={rate.delay} /> : null}
      {rate.delay > 0 && !rate.blocked ? (
        <p role="status">You can retry now.</p>
      ) : null}
      <Button type="submit" disabled={write.isPending || rate.blocked}>
        {write.isPending ? "Issuing…" : "Issue invitation"}
      </Button>
    </form>
  );
}
