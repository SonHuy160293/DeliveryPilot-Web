import { StatusBadge } from "@/components/StatusBadge";
import { formatInstant } from "@/lib/format";
import type { EngagementScope } from "@/features/engagements/api/queries";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
export function ClientLinkTab({
  engagement,
}: {
  scope: EngagementScope;
  engagement: EngagementDetail;
  canManage: boolean;
  actions: EngagementActions;
}) {
  return (
    <section aria-label="Client link" className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Client link</h2>
      {engagement.clientOrganizationId ? (
        <p>
          Linked to a client workspace on{" "}
          {formatInstant(engagement.clientLinkedAt)}
        </p>
      ) : engagement.hasOutstandingLinkCode ? (
        <div className="flex flex-col items-start gap-2">
          <StatusBadge label="Code outstanding" tone="attention" />
          <p>Expires {formatInstant(engagement.linkCodeExpiresAt)}</p>
        </div>
      ) : null}
    </section>
  );
}
