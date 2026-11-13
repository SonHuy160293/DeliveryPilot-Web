import type { ProjectWorkspace } from "@/features/projects/api/mockSupport";
import {
  before,
  membership,
  parse,
  recordEvent,
  preserveAdministrator,
} from "@/features/projects/api/mockSupport";
import type { ProjectInvitationResponseRepository } from "@/features/projects/guest-invitations/recipient/projectInvitationResponseRepository";
import { ProjectInvitationError } from "@/features/projects/guest-invitations/recipient/recipientErrors";
import * as shapes from "@/features/projects/api/contracts";
import { projectInvitationPreviewFixture } from "@/mocks/projects";
export function createMockProjectRecipient(
  locate: (id: string) => ProjectWorkspace,
) {
  function unavailable(): never {
    throw new ProjectInvitationError("unavailable");
  }
  async function admit(
    id: string,
    proof: string,
    operation: string,
    signal?: AbortSignal,
  ) {
    const current = await before(operation, signal, "portal");
    if (!shapes.uuid.safeParse(id).success || !proof.trim()) unavailable();
    const workspace = locate(id);
    const record = [...workspace.records.values()].find((row) =>
      row.invitations.some((item) => item.id === id),
    );
    const invitation = record?.invitations.find((item) => item.id === id);
    if (!record || !invitation) unavailable();
    const emailMatches =
      invitation.recipientEmail.trim().toLowerCase() ===
      current.person.primaryEmail.trim().toLowerCase();
    if (["Declined", "Cancelled", "Expired"].includes(invitation.status))
      unavailable();
    const target = record.participants.find(
      (item) => item.userId === current.person.id && item.status === "Active",
    );
    if (invitation.status === "Accepted") {
      if (emailMatches && target?.kind === "Guest")
        return { current, record, invitation, target, alreadyGuest: true };
      unavailable();
    }
    if (Date.parse(invitation.expiresAt) <= Date.now()) {
      invitation.status = "Expired";
      unavailable();
    }
    const issuer = record.participants.find(
      (item) =>
        item.userId === invitation.issuedByUserId &&
        item.status === "Active" &&
        item.kind === "Member",
    );
    if (
      !issuer?.roles.some(
        (role) => role === "ProjectAdministrator" || role === "ProjectManager",
      )
    )
      unavailable();
    if (!emailMatches) throw new ProjectInvitationError("mismatch");
    if (membership(current.person.id))
      throw new ProjectInvitationError("member");
    return {
      current,
      record,
      invitation,
      target,
      alreadyGuest: target?.kind === "Guest",
    };
  }
  const methods: ProjectInvitationResponseRepository = {
    kind: "mock",
    async preview(id, proof, signal) {
      const state = await admit(
        id,
        proof,
        "projectInvitations.preview",
        signal,
      );
      if (state.alreadyGuest)
        return {
          kind: "already-guest",
          projectId: state.record.detail.id,
          projectName: state.record.detail.name,
        };
      return {
        kind: "preview",
        preview: {
          ...parse(shapes.invitationPreview, {
            ...projectInvitationPreviewFixture,
            invitationId: state.invitation.id,
            projectName: state.record.detail.name,
            offeredRoleCode: state.invitation.offeredRoleCode,
            inviterDisplayName:
              state.record.participants.find(
                (person) => person.userId === state.invitation.issuedByUserId,
              )?.displayName ?? null,
            expiresAt: state.invitation.expiresAt,
            version: state.invitation.version,
          }),
          replacesFormerMembership: state.target?.kind === "Member",
        },
      };
    },
    async accept(id, proof, expectedVersion, signal) {
      const { current, record, invitation, target, alreadyGuest } = await admit(
        id,
        proof,
        "projectInvitations.accept",
        signal,
      );
      if (alreadyGuest) return { projectId: record.detail.id };
      if (
        !shapes.version.safeParse(expectedVersion).success ||
        invitation.version !== expectedVersion
      )
        unavailable();
      if (target) preserveAdministrator(record, target, false);
      const now = new Date().toISOString();
      const previous =
        target ??
        record.participants.find(
          (person) => person.userId === current.person.id,
        );
      if (previous) {
        previous.kind = "Guest";
        previous.status = "Active";
        previous.roles = [invitation.offeredRoleCode];
        previous.activeSince = now;
        previous.version++;
      } else
        record.participants.push({
          id: crypto.randomUUID(),
          userId: current.person.id,
          displayName: current.person.displayName,
          primaryEmail: current.person.primaryEmail,
          kind: "Guest",
          status: "Active",
          roles: [invitation.offeredRoleCode],
          firstJoinedAt: now,
          activeSince: now,
          isClientProductOwner: false,
          version: 1,
        });
      invitation.status = "Accepted";
      invitation.version++;
      recordEvent(
        record,
        current,
        "GuestInvitationAccepted",
        `${current.person.displayName} joined as a guest`,
      );
      return { projectId: record.detail.id };
    },
    async decline(id, proof, expectedVersion, signal) {
      const { current, record, invitation, alreadyGuest } = await admit(
        id,
        proof,
        "projectInvitations.decline",
        signal,
      );
      if (
        alreadyGuest ||
        invitation.status !== "Pending" ||
        invitation.version !== expectedVersion ||
        !shapes.version.safeParse(expectedVersion).success
      )
        unavailable();
      invitation.status = "Declined";
      invitation.version++;
      recordEvent(
        record,
        current,
        "GuestInvitationDeclined",
        "Guest invitation declined",
      );
    },
  };
  return methods;
}
