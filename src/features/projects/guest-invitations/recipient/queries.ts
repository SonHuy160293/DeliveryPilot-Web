import { getProjectInvitationResponseRepository } from "@/features/projects/guest-invitations/recipient/projectInvitationResponseRepository";
import {
  assertRecipientOwner,
  type ProjectRecipientOwner,
} from "@/features/projects/guest-invitations/recipient/owner";
import type { ProjectInvitationSecret } from "@/features/projects/guest-invitations/recipient/invitationFlow";
import { ApiError } from "@/lib/api/apiError";
import { ProjectInvitationError } from "@/features/projects/guest-invitations/recipient/recipientErrors";
function safeFailure(error: unknown): never {
  if (error instanceof ProjectInvitationError)
    throw new ProjectInvitationError(error.problem);
  throw error instanceof ApiError
    ? new ApiError(error.kind, "The request could not be completed.", {
        status: error.details.status,
        retryAfterMs: error.details.retryAfterMs,
      })
    : new ApiError("protocol", "The response could not be read.");
}
export const projectInvitationRepositoryKind = () =>
  getProjectInvitationResponseRepository().kind;
function assertCurrent(owner: ProjectRecipientOwner, signal: AbortSignal) {
  assertRecipientOwner(owner);
  if (signal.aborted)
    throw new ApiError("cancelled", "The request was cancelled.");
}
/** Imperative calls only. Proof-bearing inputs never enter Query keys or mutation caches. */
export const projectRecipientApi = {
  async preview(
    owner: ProjectRecipientOwner,
    secret: ProjectInvitationSecret,
    signal: AbortSignal,
  ) {
    assertCurrent(owner, signal);
    const result = await getProjectInvitationResponseRepository()
      .preview(secret.invitationId, secret.proof, signal)
      .catch(safeFailure);
    assertCurrent(owner, signal);
    return result;
  },
  async accept(
    owner: ProjectRecipientOwner,
    secret: ProjectInvitationSecret,
    version: number,
    signal: AbortSignal,
  ) {
    assertCurrent(owner, signal);
    const result = await getProjectInvitationResponseRepository()
      .accept(secret.invitationId, secret.proof, version, signal)
      .catch(safeFailure);
    assertCurrent(owner, signal);
    return result;
  },
  async decline(
    owner: ProjectRecipientOwner,
    secret: ProjectInvitationSecret,
    version: number,
    signal: AbortSignal,
  ) {
    assertCurrent(owner, signal);
    await getProjectInvitationResponseRepository()
      .decline(secret.invitationId, secret.proof, version, signal)
      .catch(safeFailure);
    assertCurrent(owner, signal);
  },
};
