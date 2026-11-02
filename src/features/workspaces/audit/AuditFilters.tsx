import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { uuid } from "@/features/workspaces/api/contracts";
import {
  auditActions,
  auditInput,
  type AuditInput,
} from "@/features/workspaces/api/auditContracts";
import { FormField } from "@/features/workspaces/components/FormField";
import { auditLabels } from "@/features/workspaces/audit/auditLabels";
import { AuditAdvancedFields } from "@/features/workspaces/audit/AuditAdvancedFields";

const optionalId = z
  .string()
  .refine(
    (value) => !value || uuid.safeParse(value).success,
    "Enter a valid UUID or leave blank.",
  );
const localTime = z
  .string()
  .refine(
    (value) => !value || Number.isFinite(Date.parse(value)),
    "Enter a valid local date and time.",
  );
const schema = z
  .object({
    actorUserId: optionalId,
    membershipId: optionalId,
    targetId: optionalId,
    action: z.string(),
    from: localTime,
    to: localTime,
  })
  .refine(
    (value) =>
      !value.from || !value.to || Date.parse(value.from) < Date.parse(value.to),
    { message: "The start must be before the exclusive end.", path: ["to"] },
  );
export type Values = z.infer<typeof schema>;
export function AuditFilters({
  onApply,
}: {
  onApply: (input: AuditInput) => void;
}) {
  const [advanced, setAdvanced] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      actorUserId: "",
      membershipId: "",
      targetId: "",
      action: "all",
      from: "",
      to: "",
    },
  });
  function submit(values: Values) {
    const parsed = auditInput.safeParse({
      actorUserId: values.actorUserId || undefined,
      membershipId: values.membershipId || undefined,
      targetId: values.targetId || undefined,
      action: values.action === "all" ? undefined : values.action,
      from: values.from ? new Date(values.from).toISOString() : undefined,
      to: values.to ? new Date(values.to).toISOString() : undefined,
    });
    if (parsed.success) onApply(parsed.data);
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void handleSubmit(submit, (invalid) => {
          const first = invalid.actorUserId
            ? "actorUserId"
            : invalid.membershipId
              ? "membershipId"
              : invalid.targetId
                ? "targetId"
                : undefined;
          if (first) {
            setAdvanced(true);
            requestAnimationFrame(() => {
              setFocus(first);
            });
          }
        })(event);
      }}
      className="flex flex-col gap-4"
    >
      <details
        className="flex flex-col gap-4"
        open={advanced}
        onToggle={(event) => {
          setAdvanced(event.currentTarget.open);
        }}
      >
        <summary className="min-h-11 cursor-pointer">Advanced filters</summary>
        <AuditAdvancedFields register={register} errors={errors} />
      </details>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="audit-action">Action</Label>
          <Controller
            name="action"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="audit-action">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="all">All registered actions</SelectItem>
                    {auditActions.map((action) => (
                      <SelectItem key={action} value={action}>
                        {auditLabels[action]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          />
        </div>
        <FormField
          id="audit-from"
          label="From, inclusive (local time)"
          type="datetime-local"
          step="1"
          error={errors.from?.message}
          {...register("from")}
        />
        <FormField
          id="audit-to"
          label="To, exclusive (local time)"
          type="datetime-local"
          step="1"
          error={errors.to?.message}
          {...register("to")}
        />
      </div>
      <Button type="submit">Apply audit filters</Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          reset();
          onApply({});
        }}
      >
        Clear filters
      </Button>
    </form>
  );
}
