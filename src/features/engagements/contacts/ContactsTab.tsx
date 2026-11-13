import { EmptyState } from "@/components/EmptyState";
import { DataTable } from "@/components/DataTable";
import { ContactDialog } from "@/features/engagements/contacts/ContactDialog";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
const labels = {
  ClientProductOwner: "Client Product Owner",
  Sponsor: "Sponsor",
  Other: "Other",
} as const;
export function ContactsTab({
  engagement,
  canManage,
  actions,
}: {
  engagement: EngagementDetail;
  canManage: boolean;
  actions: EngagementActions;
}) {
  const canEdit = canManage && engagement.status === "Active";
  return (
    <section aria-label="Contacts" className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Contacts</h2>
      {canEdit ? (
        <div>
          <ContactDialog engagement={engagement} actions={actions} />
        </div>
      ) : null}
      {engagement.contacts.length ? (
        <DataTable
          caption="Contacts"
          rows={engagement.contacts}
          rowKey={(row) => row.id}
          rowHeader={(row) => row.name}
          columns={[
            { id: "name", header: "Name", cell: () => null },
            { id: "email", header: "Email", cell: (row) => row.email },
            {
              id: "role",
              header: "Contact role",
              cell: (row) => labels[row.contactRole],
            },
            ...(canEdit
              ? [
                  {
                    id: "actions",
                    header: "Actions",
                    cell: (row: EngagementDetail["contacts"][number]) => (
                      <div className="flex flex-wrap gap-2">
                        <ContactDialog
                          engagement={engagement}
                          contact={row}
                          actions={actions}
                        />
                      </div>
                    ),
                  },
                ]
              : []),
          ]}
        />
      ) : (
        <EmptyState title="No client contacts recorded." description="" />
      )}
    </section>
  );
}
