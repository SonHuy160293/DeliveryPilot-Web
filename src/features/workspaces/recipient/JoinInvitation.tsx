import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { ApiFeedback } from "@/components/ApiFeedback";
import { ConfirmAction } from "@/components/ConfirmAction";
import { useRecipientResponse } from "@/features/workspaces/recipient/useRecipientResponse";
import { formatInstant } from "@/lib/format";
import { ROUTES } from "@/lib/routes";

export default function JoinInvitation({ owner }: { owner: SessionOwner }) {
  const flow = useRecipientResponse(owner);
  const [declining, setDeclining] = useState(false);
  return (
    <section
      className="flex min-w-0 flex-col gap-4"
      aria-label="Workspace invitation"
    >
      <p className="text-sm">
        This offer is checked against your signed-in account. A different
        account must reopen the original email; invitation access is not carried
        between accounts.
      </p>
      <ApiFeedback
        error={declining ? undefined : flow.error}
        write={Boolean(flow.preview)}
      />
      {flow.outcome ? (
        <ApiFeedback>
          {flow.outcome === "accepted"
            ? "Invitation acceptance was confirmed. If workspace entry could not be checked, return to selection and refresh."
            : "Invitation declined. No membership was created."}
        </ApiFeedback>
      ) : null}
      {!flow.available && !flow.outcome ? (
        <p role="status">
          Reopen the original invitation email to start a fresh flow. The link
          may be unavailable for this account.
        </p>
      ) : null}
      {flow.available && !flow.preview && !flow.outcome ? (
        <Button
          disabled={flow.pending}
          onClick={() => {
            void flow.run("preview");
          }}
        >
          {flow.pending ? "Checking offer…" : "Preview invitation"}
        </Button>
      ) : null}
      {flow.preview && !flow.outcome ? (
        <>
          <h2 className="break-words text-xl font-semibold">
            {flow.preview.workspaceName}
          </h2>
          <p>Offer deadline: {formatInstant(flow.preview.expiresAt)}</p>
          <ul className="flex flex-col gap-2">
            {flow.preview.offeredRoles.map((role) => (
              <li key={role.roleId} className="break-words">
                {role.name}
              </li>
            ))}
          </ul>
          {flow.preview.requiresReissue ? (
            <p role="status">
              This offer needs reissue by a workspace manager before it can be
              accepted.
            </p>
          ) : !flow.preview.canAccept ? (
            <p role="status">
              Acceptance is unavailable for the current membership state.
            </p>
          ) : null}
          {flow.uncertain ? (
            <p role="status">
              The response was interrupted or rejected. Review the error.
              Acceptance can be deliberately retried with this same proof;
              repeated decline may report a closed offer.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button
              disabled={
                flow.pending ||
                !flow.preview.canAccept ||
                flow.preview.requiresReissue
              }
              onClick={() => {
                void flow.run("accept");
              }}
            >
              {flow.pending
                ? "Submitting…"
                : flow.uncertain
                  ? "Retry acceptance with same proof"
                  : "Accept invitation"}
            </Button>
            <ConfirmAction
              label="Decline invitation"
              target={flow.preview.workspaceName}
              reasonMode="none"
              onOpenChange={setDeclining}
              consequence="This pending invitation will close without creating membership."
              pending={flow.pending}
              error={flow.error}
              onConfirm={() => flow.run("decline")}
            />
          </div>
        </>
      ) : null}
      <Button asChild variant="outline">
        <Link to={ROUTES.workspaces} onClick={flow.abandon}>
          Back to workspaces
        </Link>
      </Button>
    </section>
  );
}
