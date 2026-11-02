import type { Nomination } from "@/features/workspaces/api/contracts";
import type { SessionOwner } from "@/features/workspaces/api/request";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { useWorkspaceMutation } from "@/features/workspaces/model/useWorkspaceMutation";
import { ConfirmAction } from "@/features/workspaces/components/ConfirmAction";
import { ApiFeedback } from "@/features/workspaces/components/ApiFeedback";

export function NominationActions({
  owner,
  nomination,
  management = false,
  workspaceName,
  nomineeName,
}: {
  owner: SessionOwner;
  nomination: Nomination;
  management?: boolean;
  workspaceName?: string;
  nomineeName?: string;
}) {
  const scope = { ...owner, workspaceId: nomination.organizationId };
  const write = useWorkspaceMutation(
    scope,
    "ownership",
    (
      input: { kind: "accept" | "decline" | "cancel"; reason: string | null },
      signal,
    ) => {
      const args = { expectedVersion: nomination.version };
      if (input.kind === "cancel")
        return workspaceApi.cancelNomination(
          owner,
          nomination.organizationId,
          nomination.id,
          { ...args, reason: input.reason },
          signal,
        );
      return input.kind === "accept"
        ? workspaceApi.acceptNomination(
            owner,
            nomination.organizationId,
            nomination.id,
            args,
            signal,
          )
        : workspaceApi.declineNomination(
            owner,
            nomination.organizationId,
            nomination.id,
            args,
            signal,
          );
    },
  );
  const confirm =
    (kind: "accept" | "decline" | "cancel") => async (reason: string | null) =>
      Boolean(await write.run({ kind, reason }));
  return (
    <div className="flex flex-col gap-3">
      {nomination.status === "pending" ? (
        <div className="flex flex-wrap gap-3">
          {management ? (
            <ConfirmAction
              label="Cancel nomination"
              target={nomineeName ?? nomination.id}
              consequence="The pending nomination will close. Existing Owners are unaffected."
              reasonMode="optional"
              pending={write.isPending}
              error={write.error}
              onConfirm={confirm("cancel")}
            />
          ) : (
            <>
              <ConfirmAction
                label="Accept Owner nomination"
                target={workspaceName ?? nomination.organizationId}
                consequence="You will become an additional Owner. Existing Owners remain until a separate explicit step-down."
                reasonMode="none"
                pending={write.isPending}
                error={write.error}
                disabled={!nomination.canAccept}
                onConfirm={confirm("accept")}
              />
              <ConfirmAction
                label="Decline Owner nomination"
                target={workspaceName ?? nomination.organizationId}
                consequence="The pending nomination will close without granting Owner."
                reasonMode="none"
                pending={write.isPending}
                error={write.error}
                onConfirm={confirm("decline")}
              />
            </>
          )}
        </div>
      ) : null}
      {!management &&
      nomination.status === "pending" &&
      !nomination.canAccept ? (
        <p className="text-sm">
          Acceptance is unavailable under the current nomination eligibility.
          Refresh or ask a current Owner to review it.
        </p>
      ) : null}
      {write.isSuccess ? (
        <ApiFeedback>
          The server confirmed the nomination response. Ownership acceptance and
          any later step-down are separate operations.
        </ApiFeedback>
      ) : null}
    </div>
  );
}
