import { DataTable } from "@/components/DataTable";
import { ShareRow, type ShareRowItem } from "@/features/sharing/ShareRow";
import type { GuestShare } from "@/features/sharing/api/types";
import type { SharingActions } from "@/features/sharing/model/useSharingActions";
export function ShareGroup({
  title,
  description,
  rows,
  shares,
  people,
  actions,
}: {
  title: string;
  description?: string;
  rows: ShareRowItem[];
  shares: GuestShare[];
  people: Record<string, string>;
  actions: SharingActions;
}) {
  return (
    <section aria-label={title} className="flex min-w-0 flex-col gap-3">
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      <DataTable
        caption={title}
        rows={rows}
        rowKey={(row) => JSON.stringify(row.item)}
        rowHeader={(row) => row.label}
        columns={[
          { id: "item", header: "Item", cell: () => null },
          {
            id: "sharing",
            header: "Sharing",
            cell: (row) => (
              <ShareRow
                entry={row}
                share={shares.find(
                  (share) =>
                    share.itemType === row.item.itemType &&
                    (row.item.itemType === "BriefItem"
                      ? share.briefItemCode === row.item.briefItemCode
                      : row.item.itemType === "Stakeholder"
                        ? share.stakeholderId === row.item.stakeholderId
                        : share.status === "Shared"),
                )}
                people={people}
                actions={actions}
              />
            ),
          },
        ]}
      />
    </section>
  );
}
