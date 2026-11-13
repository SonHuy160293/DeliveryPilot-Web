import { useLocation, useSearchParams } from "react-router";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ENGAGEMENT_TABS,
  ENGAGEMENT_TAB_PARAM,
  readEngagementTab,
} from "@/lib/engagementTabs";
import { formatCount } from "@/lib/format";
import type { EngagementScope } from "@/features/engagements/api/queries";
import type { EngagementDetail } from "@/features/engagements/api/types";
import type { EngagementActions } from "@/features/engagements/model/useEngagementActions";
import { EngagementDetailsTab } from "@/features/engagements/details/EngagementDetailsTab";
import { ContractValueTab } from "@/features/engagements/contract/ContractValueTab";
import { MilestonesTab } from "@/features/engagements/milestones/MilestonesTab";
import { HistoryTab } from "@/features/engagements/history/HistoryTab";
import { ContactsTab } from "@/features/engagements/contacts/ContactsTab";
import { LinkedProjectsTab } from "@/features/engagements/projects/LinkedProjectsTab";
import { ClientLinkTab } from "@/features/engagements/link/ClientLinkTab";

export function EngagementDetailTabs({
  scope,
  engagement,
  canManage,
  canCreate,
  actions,
  people,
}: {
  scope: EngagementScope;
  engagement: EngagementDetail;
  canManage: boolean;
  canCreate: boolean;
  actions: EngagementActions;
  people: Readonly<Record<string, string>>;
}) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const state: unknown = location.state;
  const tab = readEngagementTab(params);
  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        setParams(
          (current) => {
            const updated = new URLSearchParams(current);
            if (next === "details") updated.delete(ENGAGEMENT_TAB_PARAM);
            else updated.set(ENGAGEMENT_TAB_PARAM, next);
            return updated;
          },
          { replace: true, state },
        );
      }}
    >
      <div className="min-w-0 overflow-x-auto">
        <TabsList
          aria-label="Engagement sections"
          className="w-max flex-nowrap"
        >
          {ENGAGEMENT_TABS.map((item) => (
            <TabsTrigger
              key={item.value}
              value={item.value}
              className="shrink-0 whitespace-nowrap"
            >
              {item.label}
              {item.value === "milestones"
                ? ` (${formatCount(engagement.milestones.length)})`
                : item.value === "contacts"
                  ? ` (${formatCount(engagement.contacts.length)})`
                  : ""}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value="details">
        <EngagementDetailsTab
          engagement={engagement}
          people={people}
          canManage={canManage}
          actions={actions}
        />
      </TabsContent>
      <TabsContent value="contract">
        <ContractValueTab
          engagement={engagement}
          canManage={canManage}
          actions={actions}
        />
      </TabsContent>
      <TabsContent value="milestones">
        <MilestonesTab
          engagement={engagement}
          canManage={canManage}
          actions={actions}
        />
      </TabsContent>
      <TabsContent value="history">
        <HistoryTab
          scope={scope}
          engagementId={engagement.id}
          people={people}
        />
      </TabsContent>
      <TabsContent value="contacts">
        <ContactsTab
          engagement={engagement}
          canManage={canManage}
          actions={actions}
        />
      </TabsContent>
      <TabsContent value="projects">
        <LinkedProjectsTab
          scope={scope}
          engagementId={engagement.id}
          canCreate={canCreate && engagement.status === "Active"}
        />
      </TabsContent>
      <TabsContent value="client-link">
        <ClientLinkTab
          scope={scope}
          engagement={engagement}
          canManage={canManage}
          actions={actions}
        />
      </TabsContent>
    </Tabs>
  );
}
