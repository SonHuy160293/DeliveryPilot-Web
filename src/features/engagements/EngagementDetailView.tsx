import { useState } from "react";
import { useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/PageHeader";
import { PageStateGate } from "@/components/PageStateGate";
import { MockDataBanner } from "@/components/MockDataBanner";
import { StatusBadge } from "@/components/StatusBadge";
import { StatusMessage } from "@/components/StatusMessage";
import { ApiFeedback, RefreshButton } from "@/components/ApiFeedback";
import { useDeniedCleanup } from "@/lib/query/useDeniedCleanup";
import {
  ROUTES,
  workspaceOverviewPath,
  workspaceEngagementsPath,
} from "@/lib/routes";
import { formatDate } from "@/lib/format";
import { statusTone } from "@/lib/statusTone";
import {
  engagementQuery,
  engagementDetailCapabilitiesQuery,
  engagementRepositoryKind,
  type EngagementScope,
} from "@/features/engagements/api/queries";
import { useEngagementActions } from "@/features/engagements/model/useEngagementActions";
import { EngagementHeaderActions } from "@/features/engagements/components/EngagementHeaderActions";
import { EngagementDetailNotices } from "@/features/engagements/components/EngagementDetailNotices";
import { readCreationState } from "@/features/engagements/model/creationState";
import { EngagementDetailError } from "@/features/engagements/components/EngagementDetailError";
import { EngagementDetailTabs } from "@/features/engagements/EngagementDetailTabs";

export function EngagementDetailView({
  scope,
  engagementId,
  workspaceName,
}: {
  scope: EngagementScope;
  engagementId: string;
  workspaceName: string;
}) {
  const options = engagementQuery(scope, engagementId);
  const query = useQuery(options);
  const capabilities = useQuery(engagementDetailCapabilitiesQuery(scope));
  const actions = useEngagementActions(scope, engagementId);
  useDeniedCleanup(query.error, options.queryKey);
  const location = useLocation();
  const [creation] = useState(() => readCreationState(location.state));
  const [createdMessage, setCreatedMessage] = useState(
    creation ? "Engagement created." : null,
  );
  const row = query.data;
  const canManage = capabilities.isSuccess && capabilities.data.manage;
  const mock = engagementRepositoryKind() === "mock";
  return (
    <div className="flex min-w-0 flex-col gap-8 break-words">
      {query.isPending ? (
        <PageStateGate state="loading" scope="engagement">
          {null}
        </PageStateGate>
      ) : query.error || !row ? (
        <>
          <PageHeader
            title="Engagement"
            breadcrumbs={[
              { label: "Workspaces", to: ROUTES.workspaces },
              {
                label: workspaceName,
                to: workspaceOverviewPath(scope.workspaceId),
              },
              {
                label: "Engagements",
                to: workspaceEngagementsPath(scope.workspaceId),
              },
              { label: "Engagement" },
            ]}
          />
          <EngagementDetailError
            error={query.error}
            workspaceId={scope.workspaceId}
            pending={query.isFetching}
            retry={() => {
              void query.refetch();
            }}
          />
        </>
      ) : (
        <>
          <PageHeader
            title={row.clientDisplayName}
            description={`${row.engagementName ?? "Not named"} · ${row.agreementReference} · Signed ${formatDate(row.agreementSignedOn)}`}
            breadcrumbs={[
              { label: "Workspaces", to: ROUTES.workspaces },
              {
                label: workspaceName,
                to: workspaceOverviewPath(scope.workspaceId),
              },
              {
                label: "Engagements",
                to: workspaceEngagementsPath(scope.workspaceId),
              },
              { label: row.clientDisplayName },
            ]}
            actionClassName="min-w-0 max-w-full sm:shrink"
            action={
              <EngagementHeaderActions
                engagement={row}
                workspaceId={scope.workspaceId}
                canManage={canManage}
                canCreateProject={
                  capabilities.isSuccess && capabilities.data.createProject
                }
                actions={actions}
              />
            }
          />
          <div>
            <StatusBadge label={row.status} tone={statusTone(row.status)} />
          </div>
          {capabilities.isSuccess && !canManage ? (
            <p className="text-sm text-muted-foreground">
              You can view this engagement. Editing needs engagement management
              permission.
            </p>
          ) : null}
          {capabilities.error ? (
            <div>
              <ApiFeedback error={capabilities.error} />
              <RefreshButton
                refresh={capabilities.refetch}
                pending={capabilities.isFetching}
              />
            </div>
          ) : null}
          <StatusMessage
            message={actions.message ?? createdMessage}
            mock={mock}
            onDismiss={() => {
              actions.dismiss();
              setCreatedMessage(null);
            }}
          />
          <EngagementDetailNotices
            engagement={row}
            duplicate={creation?.duplicateAgreementReference === true}
            people={capabilities.data?.people ?? {}}
          />
          <EngagementDetailTabs
            scope={scope}
            engagement={row}
            canManage={canManage}
            canCreate={
              capabilities.isSuccess && capabilities.data.createProject
            }
            actions={actions}
            people={capabilities.data?.people ?? {}}
          />
        </>
      )}
      {mock ? <MockDataBanner /> : null}
    </div>
  );
}
