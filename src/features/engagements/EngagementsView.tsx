import { useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";
import { PageHeader } from "@/components/PageHeader";
import { EngagementFilters } from "@/features/engagements/components/EngagementFilters";
import { ReadState } from "@/components/ReadState";
import { DataTable } from "@/components/DataTable";
import { MockDataBanner } from "@/components/MockDataBanner";
import { Button } from "@/components/ui/button";
import { useSearchParamState } from "@/lib/useSearchParamState";
import {
  ROUTES,
  workspaceOverviewPath,
  workspaceEngagementPath,
} from "@/lib/routes";
import {
  engagementListQuery,
  engagementCapabilitiesQuery,
  engagementRepositoryKind,
  type EngagementScope,
} from "@/features/engagements/api/queries";
import { CreateEngagementDialog } from "@/features/engagements/components/CreateEngagementDialog";
import { EngagementTable } from "@/features/engagements/components/EngagementTable";
import { EngagementReadError } from "@/features/engagements/components/EngagementReadError";

export function EngagementsView({
  scope,
  workspaceName,
}: {
  scope: EngagementScope;
  workspaceName: string;
}) {
  const [statusParam, setStatus] = useSearchParamState("status", "Active");
  const [search, setSearch] = useSearchParamState("q");
  const [, setParams] = useSearchParams();
  const status =
    statusParam === "all"
      ? undefined
      : statusParam === "Closed"
        ? "Closed"
        : "Active";
  const options = engagementListQuery(scope, status);
  const list = useInfiniteQuery(options);
  const capabilities = useQuery(engagementCapabilitiesQuery(scope));
  const canCreate = capabilities.isSuccess && capabilities.data.create;
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const query = search.trim().toLocaleLowerCase();
  const rows = (list.data?.pages.flatMap((page) => page.items) ?? []).filter(
    (row) =>
      [
        row.clientDisplayName,
        row.engagementName ?? "",
        row.agreementReference,
      ].some((value) => value.toLocaleLowerCase().includes(query)),
  );
  const filtered = Boolean(query) || status !== "Active";
  function clearFilters() {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("status");
      next.delete("q");
      return next;
    });
  }
  const create = canCreate ? (
    <CreateEngagementDialog
      scope={scope}
      open={open}
      onOpenChange={setOpen}
      onCreated={(result) => {
        setOpen(false);
        void navigate(
          workspaceEngagementPath(scope.workspaceId, result.snapshot.id),
          {
            state: {
              engagementCreated: true,
              message: "Engagement created.",
              mock: engagementRepositoryKind() === "mock",
              duplicateAgreementReference:
                result.snapshot.duplicateAgreementReference,
              agreementReference: result.snapshot.agreementReference,
            },
          },
        );
      }}
    />
  ) : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-8">
      <PageHeader
        title="Engagements"
        description="Client agreements this workspace delivers against."
        breadcrumbs={[
          { label: "Workspaces", to: ROUTES.workspaces },
          {
            label: workspaceName,
            to: workspaceOverviewPath(scope.workspaceId),
          },
          { label: "Engagements" },
        ]}
        action={create}
      />
      {engagementRepositoryKind() === "mock" ? <MockDataBanner /> : null}
      <EngagementFilters
        search={search}
        status={status ?? "all"}
        setSearch={setSearch}
        setStatus={setStatus}
        count={rows.length}
        hasMore={list.hasNextPage}
        onReset={clearFilters}
      />
      {list.isPending ? (
        <DataTable
          caption="engagements"
          loading
          columns={[]}
          rows={[]}
          rowKey={() => ""}
          rowHeader={() => null}
        />
      ) : list.error ? (
        <EngagementReadError
          error={list.error}
          retry={() => {
            void list.refetch();
          }}
          pending={list.isFetching}
        />
      ) : (
        <ReadState
          query={list}
          queryKey={options.queryKey}
          scope="engagements"
          empty={rows.length === 0}
          emptyTitle={
            filtered
              ? "No engagements match these filters."
              : "No engagements yet"
          }
          emptyDescription={
            filtered
              ? "Clear filters to view available engagements."
              : "Record a client agreement to create client projects under it."
          }
          emptyAction={
            filtered ? (
              <Button variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : canCreate ? (
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(true);
                }}
              >
                Create engagement
              </Button>
            ) : undefined
          }
        >
          <EngagementTable
            workspaceId={scope.workspaceId}
            rows={rows}
            hasMore={list.hasNextPage}
            loadingMore={list.isFetchingNextPage}
            onLoadMore={() => {
              void list.fetchNextPage({ cancelRefetch: false });
            }}
          />
        </ReadState>
      )}
    </div>
  );
}
