import { DefinitionList } from "@/components/DefinitionList";
import { formatMoney, formatPersonDays } from "@/lib/format";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { ContractValueDialog } from "@/features/engagements/contract/ContractValueDialog";

export function ContractValueTab({
  engagement,
  canManage,
  actions,
}: {
  engagement: EngagementDetail;
  canManage: boolean;
  actions: EngagementActions;
}) {
  return (
    <section className="flex flex-col gap-4" aria-label="Contract value">
      <h2 className="text-xl font-semibold">Contract</h2>
      <DefinitionList
        items={[
          {
            id: "amount",
            label: "Contract value",
            value: formatMoney(
              engagement.contractAmount,
              engagement.contractCurrency,
            ),
          },
          {
            id: "effort",
            label: "Planned effort",
            value: formatPersonDays(engagement.plannedEffortPersonDays),
          },
          { id: "model", label: "Contract model", value: "Fixed price" },
        ]}
      />
      {canManage ? (
        <div
          hidden={engagement.status !== "Active"}
          className={engagement.status !== "Active" ? "hidden" : undefined}
        >
          <ContractValueDialog engagement={engagement} actions={actions} />
        </div>
      ) : null}
    </section>
  );
}
