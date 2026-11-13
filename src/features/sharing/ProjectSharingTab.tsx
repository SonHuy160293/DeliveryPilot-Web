import { useEffect, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ReadState } from "@/components/ReadState";
import { DefaultViewNote } from "@/features/sharing/DefaultViewNote";
import { ShareGroup } from "@/features/sharing/ShareGroup";
import { SharingHistory } from "@/features/sharing/SharingHistory";
import {
  sharesQuery,
  sharingContextQuery,
  type SharingScope,
} from "@/features/sharing/api/queries";
import { SHARE_BRIEF_ITEMS } from "@/features/sharing/model/items";
import { useSharingActions } from "@/features/sharing/model/useSharingActions";
import type { ProjectDetail } from "@/features/projects/api/types";
import { ApiError } from "@/lib/api/apiError";
export function ProjectSharingTab({
  scope,
  project,
  onSuccess,
  onUnavailable,
  PreviewComponent,
}: {
  scope: SharingScope;
  project: ProjectDetail;
  onSuccess: (message: string) => void;
  onUnavailable: (error: unknown) => void;
  PreviewComponent?: ComponentType<{ scope: SharingScope; projectId: string }>;
}) {
  const options = sharingContextQuery(scope, project.id),
    context = useQuery({
      ...options,
      enabled:
        project.myParticipantKind === "Member" && project.permissions.share,
    }),
    shares = useQuery({
      ...sharesQuery(scope, project.id),
      enabled:
        project.myParticipantKind === "Member" && project.permissions.share,
    });
  const actions = useSharingActions(
      scope,
      project.id,
      onSuccess,
      onUnavailable,
    ),
    [preview, setPreview] = useState(false);
  const error = context.error ?? shares.error;
  useEffect(() => {
    if (error instanceof ApiError && error.kind === "not-found")
      onUnavailable(error);
  }, [error, onUnavailable]);
  if (!project.permissions.share || project.myParticipantKind !== "Member")
    return null;
  const data = context.data;
  return (
    <section
      aria-label="Client sharing"
      className="flex min-w-0 flex-col gap-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">Client sharing</h2>
        <Button
          variant="outline"
          aria-pressed={preview}
          onClick={() => {
            setPreview((value) => !value);
          }}
        >
          Preview as client
        </Button>
      </div>
      <DefaultViewNote />
      {actions.notice ? (
        <Alert>
          <AlertDescription>{actions.notice}</AlertDescription>
        </Alert>
      ) : null}
      {preview ? (
        <section aria-label="Client preview" className="flex flex-col gap-4">
          <Alert>
            <AlertDescription>
              Preview — this is what guests of this project see.
            </AlertDescription>
          </Alert>
          {PreviewComponent ? (
            <PreviewComponent scope={scope} projectId={project.id} />
          ) : null}
        </section>
      ) : null}
      <ReadState
        query={{
          ...context,
          isPending: context.isPending || shares.isPending,
          error,
          data: context.data && shares.data,
          refetch: () => {
            void context.refetch();
            void shares.refetch();
          },
        }}
        queryKey={options.queryKey}
        scope="Client sharing"
      >
        {data && shares.data ? (
          <>
            <ShareGroup
              title="Brief items"
              rows={SHARE_BRIEF_ITEMS.map((item) => ({
                label: item.label,
                item: { itemType: "BriefItem", briefItemCode: item.code },
                empty: !data.brief[item.field]?.trim(),
              }))}
              shares={shares.data}
              people={data.people}
              actions={actions}
            />
            <ShareGroup
              title="Stakeholder entries"
              description="Email and team link are never shown to guests."
              rows={data.stakeholders
                .filter((row) => !row.retiredAt)
                .map((row) => ({
                  label: `${row.name} (${row.side})`,
                  item: { itemType: "Stakeholder", stakeholderId: row.id },
                }))}
              shares={shares.data}
              people={data.people}
              actions={actions}
            />
            {data.project.kind === "Client" && data.project.engagement ? (
              <ShareGroup
                title="Engagement summary"
                description="Client name, engagement name, reference, milestones — never money, effort or contacts."
                rows={[
                  {
                    label: `${data.project.engagement.clientDisplayName} — ${data.project.engagement.engagementName ?? data.project.engagement.agreementReference}`,
                    item: { itemType: "EngagementSummary" },
                    unavailable: data.canShareEngagement
                      ? undefined
                      : "Sharing the engagement summary needs engagement read access.",
                  },
                ]}
                shares={shares.data}
                people={data.people}
                actions={actions}
              />
            ) : (
              <section aria-label="Engagement summary">
                <h3 className="text-lg font-semibold">Engagement summary</h3>
                <p>
                  This project has no engagement, so there is nothing to share
                  here.
                </p>
              </section>
            )}
            <SharingHistory scope={scope} projectId={project.id} />
          </>
        ) : null}
      </ReadState>
    </section>
  );
}
