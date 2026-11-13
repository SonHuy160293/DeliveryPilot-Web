import { Button } from "@/components/ui/button";
import type { ProjectInvitationPreview } from "@/features/projects/api/types";
import { projectRoleLabel } from "@/features/projects/model/roleLabels";
import { formatDate } from "@/lib/format";
import type { ReactNode } from "react";
export function ProjectInvitationPreviewCard({
  preview,
  pending,
  blocked,
  onAccept,
  declineAction,
}: {
  preview: ProjectInvitationPreview & { replacesFormerMembership?: boolean };
  pending: boolean;
  blocked: boolean;
  onAccept: () => void;
  declineAction: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <p>
        {preview.inviterDisplayName?.trim() || "Name unavailable"} invited you
        to
      </p>
      <h2 className="break-words text-xl font-semibold">
        {preview.projectName}
      </h2>
      <p>Your role: {projectRoleLabel(preview.offeredRoleCode)}</p>
      <p>Expires {formatDate(preview.expiresAt.slice(0, 10))}</p>
      <p>
        You'll join as a guest. You'll see this project only, and only what the
        team shares with you.
      </p>
      {preview.replacesFormerMembership ? (
        <p>
          Accepting ends your previous team membership on this project and adds
          you as a guest.
        </p>
      ) : null}
      {!blocked ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={pending} onClick={onAccept}>
            {pending ? "Submitting…" : "Accept invitation"}
          </Button>
          {declineAction}
        </div>
      ) : null}
    </div>
  );
}
