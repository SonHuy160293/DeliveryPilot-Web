import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormField } from "@/components/FormField";
import type { Values } from "@/features/workspaces/audit/AuditFilters";

export function AuditAdvancedFields({
  register,
  errors,
}: {
  register: UseFormRegister<Values>;
  errors: FieldErrors<Values>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <FormField
        id="audit-actor"
        label="Actor user UUID (optional)"
        error={errors.actorUserId?.message}
        {...register("actorUserId")}
      />
      <FormField
        id="audit-membership"
        label="Membership UUID (optional)"
        error={errors.membershipId?.message}
        {...register("membershipId")}
      />
      <FormField
        id="audit-target"
        label="Aggregate target UUID (optional)"
        error={errors.targetId?.message}
        {...register("targetId")}
      />
    </div>
  );
}
