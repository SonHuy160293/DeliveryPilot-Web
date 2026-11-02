import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Invitation } from "@/features/workspaces/api/contracts";
import { roleIds } from "@/features/workspaces/api/inputs";
import type { ScopedOwner } from "@/features/workspaces/api/queries";
import { workspaceApi } from "@/features/workspaces/api/workspaceApi";
import { useWorkspaceMutation } from "@/features/workspaces/model/useWorkspaceMutation";
import { ConfirmAction } from "@/features/workspaces/components/ConfirmAction";
import { RolePicker } from "@/features/workspaces/roles/RolePicker";

type Action = { kind: "resend" | "reissue" | "cancel"; reason: string | null };
export function InvitationActions({
  scope,
  invitation,
  onChanged,
}: {
  scope: ScopedOwner;
  invitation: Invitation;
  onChanged: (value: Invitation) => void;
}) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const write = useWorkspaceMutation(
    scope,
    "invitations",
    (input: Action, signal) => {
      const body = {
        expectedVersion: invitation.version,
        reason: input.reason,
      };
      if (input.kind === "resend")
        return workspaceApi.resend(
          scope,
          scope.workspaceId,
          invitation.id,
          body,
          signal,
        );
      if (input.kind === "reissue")
        return workspaceApi.reissue(
          scope,
          scope.workspaceId,
          invitation.id,
          { ...body, reason: input.reason ?? "", roleIds: selected },
          signal,
        );
      return workspaceApi.cancelInvitation(
        scope,
        scope.workspaceId,
        invitation.id,
        { ...body, reason: input.reason ?? "" },
        signal,
      );
    },
  );
  const confirm = (kind: Action["kind"]) => async (reason: string | null) => {
    const result = await write.run({ kind, reason });
    if (result) onChanged(result);
    return Boolean(result);
  };
  if (invitation.status !== "pending")
    return (
      <p className="text-sm">
        This persisted offer is closed. It cannot be resent or cancelled.
      </p>
    );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <ConfirmAction
          label="Resend invitation"
          target={invitation.recipientEmail}
          reasonMode="optional"
          consequence="Existing email links will stop working. The original sponsor and frozen role names stay unchanged."
          pending={write.isPending}
          error={write.error}
          onConfirm={confirm("resend")}
        />
        <ConfirmAction
          label="Cancel invitation"
          target={invitation.recipientEmail}
          consequence="This pending offer will close. Any already accepted membership is unaffected."
          pending={write.isPending}
          error={write.error}
          onConfirm={confirm("cancel")}
        />
        <Button
          variant="outline"
          onClick={() => {
            setSelecting((value) => !value);
          }}
        >
          Review replacement offer
        </Button>
      </div>
      {selecting ? (
        <>
          <RolePicker
            scope={scope}
            selected={selected}
            onChange={setSelected}
          />
          <p className="text-sm">
            Choose fresh roles. Reissue closes the old offer and creates a new
            invitation identifier.
          </p>
          <ConfirmAction
            label="Replace invitation"
            target={invitation.recipientEmail}
            consequence="This replaces the old offer and makes its links unusable."
            pending={write.isPending}
            error={write.error}
            disabled={!roleIds.safeParse(selected).success}
            onConfirm={confirm("reissue")}
          />
        </>
      ) : null}
    </div>
  );
}
