import { Controller, type UseFormReturn } from "react-hook-form";
import { useContext } from "react";
import { FormReadOnlyContext } from "@/lib/formReadOnly";
import type { z } from "zod";
import { FormField } from "@/components/FormField";
import { ReasonField } from "@/components/ReasonField";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { contractForm } from "@/features/engagements/model/detailForms";

export function ContractValueFields({
  form,
  currencyLocked,
  readOnly,
}: {
  form: UseFormReturn<z.infer<typeof contractForm>>;
  currencyLocked: boolean;
  readOnly: boolean;
}) {
  const clearing = form.watch("clear");
  const pending = useContext(FormReadOnlyContext);
  const errors = form.formState.errors;
  return (
    <>
      <FormField
        id="contract-amount"
        label="Amount"
        inputMode="decimal"
        readOnly={readOnly || clearing}
        error={errors.contractAmount?.message}
        {...form.register("contractAmount")}
      />
      <FormField
        id="contract-currency"
        label="Currency"
        readOnly={readOnly || currencyLocked || clearing}
        error={errors.contractCurrency?.message}
        {...form.register("contractCurrency")}
      />
      {currencyLocked ? (
        <p className="text-sm text-muted-foreground">
          Clear amount and currency before changing currency.
        </p>
      ) : null}
      <div className="flex items-center gap-3">
        <Controller
          name="clear"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              id="contract-clear"
              checked={field.value}
              onCheckedChange={(value) => {
                field.onChange(value === true);
              }}
              disabled={readOnly || pending}
              ref={field.ref}
              onBlur={field.onBlur}
            />
          )}
        />
        <Label htmlFor="contract-clear">Clear amount and currency</Label>
      </div>
      <FormField
        id="contract-effort"
        label="Planned effort (person-days)"
        inputMode="decimal"
        readOnly={readOnly}
        error={errors.plannedEffortPersonDays?.message}
        {...form.register("plannedEffortPersonDays")}
      />
      <ReasonField
        required={false}
        id="contract-reason"
        readOnly={readOnly}
        error={errors.reason?.message}
        {...form.register("reason")}
        value={form.watch("reason")}
      />
    </>
  );
}
