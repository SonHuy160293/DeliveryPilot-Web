import { Link } from "react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ApiFeedback } from "@/components/ApiFeedback";
import { useRateLimit } from "@/lib/api/useRateLimit";
import { RetryDelay } from "@/components/RetryDelay";
import type { ProjectRecipientOwner } from "@/features/projects/guest-invitations/recipient/owner";
import { useProjectRecipientResponse } from "@/features/projects/guest-invitations/recipient/useProjectRecipientResponse";
import { ProjectInvitationLoading } from "@/features/projects/guest-invitations/recipient/ProjectInvitationLoading";
import { ProjectInvitationNotice } from "@/features/projects/guest-invitations/recipient/ProjectInvitationNotice";
import { ProjectInvitationPreviewCard } from "@/features/projects/guest-invitations/recipient/ProjectInvitationPreviewCard";
import { portalProjectPath } from "@/lib/routes";
import { ProjectInvitationDeclineDialog } from "@/features/projects/guest-invitations/recipient/ProjectInvitationDeclineDialog";
export default function JoinProjectInvitation({
  owner,
}: {
  owner: ProjectRecipientOwner;
}) {
  const response = useProjectRecipientResponse(owner),
    rate = useRateLimit(response.error);
  const [declining, setDeclining] = useState(false);
  if (response.declined || response.problem)
    return (
      <ProjectInvitationNotice
        kind={
          response.declined ? "declined" : (response.problem ?? "unavailable")
        }
        onSignOut={response.signOut}
      />
    );
  if (response.result?.kind === "already-guest")
    return (
      <div className="flex flex-col gap-4">
        <h2
          tabIndex={-1}
          ref={(node) => {
            node?.focus();
          }}
          className="text-xl font-semibold"
        >
          You already have access to this project.
        </h2>
        <Button asChild>
          <Link to={portalProjectPath(response.result.projectId)}>
            Open project
          </Link>
        </Button>
      </div>
    );
  return (
    <div className="flex flex-col gap-4">
      {response.pending && !response.result ? (
        <ProjectInvitationLoading />
      ) : null}
      {response.result?.kind === "preview" ? (
        <ProjectInvitationPreviewCard
          preview={response.result.preview}
          pending={response.pending}
          blocked={!!response.error && !declining}
          onAccept={() => {
            void response.run("accept");
          }}
          declineAction={
            <ProjectInvitationDeclineDialog
              name={response.result.preview.projectName}
              pending={response.pending}
              error={response.error}
              onOpenChange={setDeclining}
              onConfirm={() => response.run("decline")}
            />
          }
        />
      ) : null}
      {response.error && !declining ? (
        <>
          <ApiFeedback error={response.error} write={!!response.result} />
          {rate.blocked ? <RetryDelay delay={rate.delay} /> : null}
          <Button
            variant="outline"
            disabled={response.pending || rate.blocked}
            onClick={() => {
              void response.retry();
            }}
          >
            Try again
          </Button>
        </>
      ) : null}
    </div>
  );
}
