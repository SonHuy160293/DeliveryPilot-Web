import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { useDialogSnapshot } from "@/features/engagements/model/useDialogSnapshot";
import {
  contractForm,
  contractValues,
  optionalNumber,
} from "@/features/engagements/model/detailForms";
import { ContractValueFields } from "@/features/engagements/contract/ContractValueFields";

export function ContractValueDialog({
  engagement,
  actions,
}: {
  engagement: EngagementDetail;
  actions: EngagementActions;
}) {
  const dialog = useDialogSnapshot(engagement, actions);
  const readOnly = dialog.snapshot.status !== "Active";
  return (
    <FormDialog
      title="Set contract value"
      submitLabel="Set contract value"
      schema={contractForm}
      defaultValues={contractValues(dialog.snapshot)}
      trigger={
        <Button variant="outline" disabled={actions.pending}>
          Set contract value
        </Button>
      }
      onOpenChange={dialog.onOpenChange}
      submitDisabled={readOnly}
      onReload={async () => contractValues(await dialog.reload())}
      onSubmit={(values) =>
        actions.run(
          {
            action: "setContractValue",
            request: {
              expectedVersion: dialog.snapshot.version,
              contractAmount: values.clear
                ? null
                : optionalNumber(values.contractAmount),
              contractCurrency: values.clear
                ? null
                : values.contractCurrency || null,
              plannedEffortPersonDays: optionalNumber(
                values.plannedEffortPersonDays,
              ),
              reason: values.reason || null,
            },
          },
          "Contract value updated.",
        )
      }
    >
      {(form) => (
        <>
          {readOnly ? (
            <p>
              This engagement is closed. Closed engagements are read-only.
              Reopen it to make changes.
            </p>
          ) : null}
          <ContractValueFields
            form={form}
            currencyLocked={dialog.snapshot.contractAmount !== null}
            readOnly={readOnly}
          />
        </>
      )}
    </FormDialog>
  );
}
