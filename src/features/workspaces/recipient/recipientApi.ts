import {
  uuid,
  invitationPreview,
  invitationAcceptance,
  invitationDecline,
} from "@/features/workspaces/api/contracts";
import {
  proofInput,
  proofVersionInput,
} from "@/features/workspaces/api/inputs";
import { request, type SessionOwner } from "@/features/workspaces/api/request";
import type { InvitationSecret } from "@/features/workspaces/recipient/invitationFlow";

function path(secret: InvitationSecret) {
  return `api/v1/organization-invitations/${uuid.parse(secret.invitationId)}`;
}
/** Imperative only: no query/mutation definitions, keys, or retained raw failures. */
export const recipientApi = {
  preview: (
    owner: SessionOwner,
    secret: InvitationSecret,
    signal: AbortSignal,
  ) =>
    request(owner, "POST", `${path(secret)}/preview`, invitationPreview, {
      body: proofInput.parse({ proof: secret.proof }),
      signal,
    }),
  accept: (
    owner: SessionOwner,
    secret: InvitationSecret,
    version: number,
    signal: AbortSignal,
  ) =>
    request(owner, "POST", `${path(secret)}/accept`, invitationAcceptance, {
      body: proofVersionInput.parse({
        proof: secret.proof,
        expectedVersion: version,
      }),
      signal,
    }),
  decline: (
    owner: SessionOwner,
    secret: InvitationSecret,
    version: number,
    signal: AbortSignal,
  ) =>
    request(owner, "POST", `${path(secret)}/decline`, invitationDecline, {
      body: proofVersionInput.parse({
        proof: secret.proof,
        expectedVersion: version,
      }),
      signal,
    }),
};
