import type { UseFormReturn } from "react-hook-form";
import { useContext, useEffect, useRef } from "react";
import { FormField, TextareaField } from "@/components/FormField";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormReadOnlyContext } from "@/lib/formReadOnly";
import {
  stakeholderForm,
  type StakeholderValues,
} from "@/features/projects/stakeholders/form";
import type { Participant } from "@/features/projects/api/types";
export function StakeholderFields({
  form,
  participants,
}: {
  form: UseFormReturn<StakeholderValues>;
  participants: Participant[];
}) {
  const disabled = useContext(FormReadOnlyContext);
  const participantError = form.formState.errors.participantId;
  const participantTrigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (participantError?.type === "server")
      participantTrigger.current?.focus();
  }, [participantError]);
  const participantMessage =
    participantError?.type === "server"
      ? "Choose someone on the team, or leave this empty."
      : participantError?.message;
  return (
    <>
      <FormField
        id="stakeholder-name"
        label="Name"
        required
        error={form.formState.errors.name?.message}
        {...form.register("name")}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="stakeholder-side">Side</Label>
        <Select
          value={form.watch("side")}
          disabled={disabled}
          onValueChange={(value) => {
            const side = stakeholderForm.shape.side.safeParse(value);
            if (side.success)
              form.setValue("side", side.data, { shouldDirty: true });
          }}
        >
          <SelectTrigger id="stakeholder-side" aria-required="true">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="Vendor">Vendor</SelectItem>
              <SelectItem value="Client">Client</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <FormField
        id="stakeholder-organization"
        label="Organization"
        error={form.formState.errors.organizationName?.message}
        {...form.register("organizationName")}
      />
      <TextareaField
        id="stakeholder-responsibilities"
        label="Responsibilities"
        error={form.formState.errors.responsibilities?.message}
        {...form.register("responsibilities")}
      />
      <TextareaField
        id="stakeholder-decisions"
        label="Decision areas"
        error={form.formState.errors.decisionAreas?.message}
        {...form.register("decisionAreas")}
      />
      <FormField
        id="stakeholder-email"
        label="Email"
        type="email"
        error={form.formState.errors.email?.message}
        {...form.register("email")}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor="stakeholder-participant">Linked team member</Label>
        <Select
          value={form.watch("participantId") || "none"}
          disabled={disabled}
          onValueChange={(value) => {
            form.setValue("participantId", value === "none" ? "" : value, {
              shouldDirty: true,
              shouldValidate: !!form.formState.errors.participantId,
            });
          }}
        >
          <SelectTrigger
            ref={participantTrigger}
            id="stakeholder-participant"
            aria-invalid={!!form.formState.errors.participantId}
            aria-describedby={
              form.formState.errors.participantId
                ? "stakeholder-participant-error"
                : undefined
            }
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="none">None</SelectItem>
              {participants
                .filter((row) => row.status === "Active")
                .map((row) => (
                  <SelectItem key={row.id} value={row.id}>
                    {row.displayName?.trim() || "Name unavailable"}
                  </SelectItem>
                ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {participantMessage ? (
          <p
            id="stakeholder-participant-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {participantMessage}
          </p>
        ) : null}
      </div>
    </>
  );
}
