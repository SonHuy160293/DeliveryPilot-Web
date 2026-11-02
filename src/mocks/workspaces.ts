/** Fictional fixture data ONLY. Never use as authorization or production content. */
export interface WorkspaceSummary {
  id: string;
  slug: string;
  name: string;
  roleLabel: "Owner" | "Member";
  memberCount: number;
  lastActivityAt: string;
}

export const mockWorkspaces: readonly WorkspaceSummary[] = [
  {
    id: "sample-workspace-a",
    slug: "northstar-delivery",
    name: "Northstar delivery",
    roleLabel: "Owner",
    memberCount: 24,
    lastActivityAt: "2026-10-29T09:00:00Z",
  },
  {
    id: "sample-workspace-b",
    slug: "harbor-engineering",
    name: "Harbor engineering",
    roleLabel: "Member",
    memberCount: 11,
    lastActivityAt: "2026-10-27T11:00:00Z",
  },
];

/** Fictional Organization contract records for tests only; production screens never import these. */
export const organizationIds = {
  organization: "019a0000-0000-7000-8000-000000000001",
  membership: "019a0000-0000-7000-8000-000000000002",
  user: "019a0000-0000-7000-8000-000000000003",
  otherUser: "019a0000-0000-7000-8000-000000000004",
  role: "019a0000-0000-7000-8000-000000000005",
  memberRole: "019a0000-0000-7000-8000-000000000006",
  invitation: "019a0000-0000-7000-8000-000000000007",
  nomination: "019a0000-0000-7000-8000-000000000008",
  otherOrganization: "019a0000-0000-7000-8000-000000000009",
  ownerRole: "019a0000-0000-7000-8000-000000000010",
  otherMembership: "019a0000-0000-7000-8000-000000000011",
  replacement: "019a0000-0000-7000-8000-000000000012",
  event: "019a0000-0000-7000-8000-000000000020",
  attempt: "019a0000-0000-7000-8000-000000000030",
};
const ids = organizationIds;
export const organizationFixtures = {
  workspace: {
    organizationId: ids.organization,
    name: "Cedar delivery",
    roles: [{ id: ids.ownerRole, code: "owner", name: "Owner" }],
    membershipId: ids.membership,
    version: 1,
    membershipVersion: 1,
  },
  creation: {
    organizationId: ids.organization,
    name: "Cedar delivery",
    status: "active",
    membershipId: ids.membership,
    roles: ["Owner"],
    version: 1,
    membershipVersion: 1,
    resultKind: "creationSnapshot",
    snapshotAt: "2026-11-05T09:00:00Z",
  },
  member: {
    membershipId: ids.membership,
    userId: ids.user,
    displayName: "Alex Example",
    primaryEmail: "alex@example.test",
    status: "active",
    roles: [{ id: ids.ownerRole, code: "owner", name: "Owner" }],
    joinedAt: "2026-11-05T09:00:00Z",
    version: 1,
  },
  otherMember: {
    membershipId: ids.otherMembership,
    userId: ids.otherUser,
    displayName: "Morgan Example",
    primaryEmail: "morgan@example.test",
    status: "active",
    roles: [{ id: ids.memberRole, code: "member", name: "Member" }],
    joinedAt: "2026-11-05T09:00:00Z",
    version: 2,
  },
  role: {
    id: ids.role,
    code: "role-reviewer",
    name: "Reviewer",
    description: null,
    origin: "custom",
    permissionCodes: ["organization.members.read"],
    version: 2,
    permissionSetVersion: 1,
    retiredAt: null,
  },
  assignment: {
    membershipId: ids.membership,
    version: 2,
    roles: [{ id: ids.role, code: "role-reviewer", name: "Reviewer" }],
    changed: true,
  },
  removal: {
    membershipId: ids.membership,
    status: "removed",
    roles: [],
    version: 2,
    changed: true,
  },
  invitation: {
    id: ids.invitation,
    organizationId: ids.organization,
    recipientEmail: "morgan@example.test",
    status: "pending",
    offeredRoles: [
      { roleId: ids.role, name: "Frozen Reviewer", permissionSetVersion: 1 },
    ],
    expiresAt: "2026-11-12T09:00:00Z",
    version: 2,
    delivery: {
      status: "queued",
      failureCode: null,
      updatedAt: "2026-11-05T09:00:00Z",
    },
  },
  preview: {
    invitationId: ids.invitation,
    organizationId: ids.organization,
    workspaceName: "Cedar delivery",
    offeredRoles: [
      { roleId: ids.role, name: "Frozen Reviewer", permissionSetVersion: 1 },
    ],
    expiresAt: "2026-11-12T09:00:00Z",
    version: 2,
    status: "pending",
    canAccept: true,
    requiresReissue: false,
  },
  acceptance: {
    outcome: "accepted",
    membershipId: ids.membership,
    organizationId: ids.organization,
    roles: [{ id: ids.role, code: "role-reviewer", name: "Reviewer" }],
    membershipVersion: 3,
  },
  nomination: {
    id: ids.nomination,
    organizationId: ids.organization,
    membershipId: ids.membership,
    nominatedByUserId: ids.otherUser,
    status: "pending",
    createdAt: "2026-11-05T09:00:00Z",
    expiresAt: "2026-11-12T09:00:00Z",
    version: 2,
    canAccept: true,
  },
  audit: {
    eventId: ids.event,
    actorUserId: null,
    actorDisplayName: null,
    organizationId: ids.organization,
    targetType: "OrganizationMembership",
    targetId: ids.membership,
    action: "organization.membership.status-changed",
    occurredAt: "2026-11-05T09:00:00Z",
    outcome: "succeeded",
    aggregateVersion: 2,
    membershipVersion: 2,
    eventOrdinal: 1,
    reason: null,
    changes: {
      userId: ids.user,
      previousStatus: "active",
      newStatus: "removed",
    },
  },
} as const;

/** Reference-layout records for the isolated browser review, never production data. */
export const organizationPortfolioReviewWorkspaces = [
  organizationFixtures.workspace,
  ...[
    "Northstar Labs",
    "CloudNine Studio",
    "Vertex Partners",
    "Vela Consulting",
  ].map((name, index) => ({
    ...organizationFixtures.workspace,
    organizationId: `019a0000-0000-7000-8000-00000000002${String(index)}`,
    name,
  })),
];
export const organizationPortfolioLongName = {
  ...organizationFixtures.workspace,
  name: organizationFixtures.workspace.name
    .replaceAll(" ", "")
    .repeat(12)
    .slice(0, 160),
};

/** Contract audit projections, with fictional IDs and deliberately nullable history. */
export const auditChangeSamples = [
  {
    action: "organization.created",
    targetType: "Organization",
    changes: {
      name: null,
      status: "active",
      createdByUserId: organizationIds.user,
    },
  },
  {
    action: "organization.membership.created",
    targetType: "OrganizationMembership",
    changes: {
      userId: organizationIds.user,
      previousStatus: null,
      newStatus: "active",
    },
  },
  {
    action: "organization.membership.status-changed",
    targetType: "OrganizationMembership",
    changes: {
      userId: organizationIds.user,
      previousStatus: "active",
      newStatus: "removed",
    },
  },
  {
    action: "organization.role-assignment.granted",
    targetType: "OrganizationRoleAssignment",
    changes: {
      roleId: organizationIds.role,
      grantVersion: 1,
      grantedByUserId: organizationIds.user,
      grantedAt: "2026-11-05T09:00:00Z",
      expiresAt: null,
      permissionSetVersion: 1,
    },
  },
  {
    action: "organization.role-assignment.revoked",
    targetType: "OrganizationRoleAssignment",
    changes: {
      roleId: organizationIds.role,
      grantVersion: 1,
      grantedAt: "2026-11-05T09:00:00Z",
      expiresAt: null,
      revokedAt: "2026-11-06T09:00:00Z",
    },
  },
  {
    action: "organization.role-assignment.regranted",
    targetType: "OrganizationRoleAssignment",
    changes: {
      roleId: organizationIds.role,
      previousGrantVersion: 1,
      grantVersion: 2,
      grantedByUserId: organizationIds.user,
      grantedAt: "2026-11-06T09:00:00Z",
      expiresAt: null,
      permissionSetVersion: 2,
    },
  },
  {
    action: "organization.role.created",
    targetType: "OrganizationRole",
    changes: {
      origin: "custom",
      templateVersion: null,
      previousPermissionSetVersion: null,
      permissionSetVersion: 1,
      addedPermissionCodes: ["organization.members.read"],
      removedPermissionCodes: [],
      permissionCodes: ["organization.members.read"],
    },
  },
  {
    action: "organization.role.permissions-changed",
    targetType: "OrganizationRole",
    changes: {
      origin: "custom",
      templateVersion: null,
      previousPermissionSetVersion: 1,
      permissionSetVersion: 2,
      addedPermissionCodes: ["organization.audit.read"],
      removedPermissionCodes: [],
      permissionCodes: ["organization.members.read", "organization.audit.read"],
    },
  },
  {
    action: "organization.role.updated",
    targetType: "OrganizationRole",
    changes: {
      previousName: null,
      newName: "Reviewer",
      descriptionChanged: true,
    },
  },
  {
    action: "organization.role.retired",
    targetType: "OrganizationRole",
    changes: {
      code: "role-reviewer",
      name: null,
      retiredAt: "2026-11-06T09:00:00Z",
      permissionSetVersion: 2,
    },
  },
  {
    action: "organization.invitation.issued",
    targetType: "OrganizationInvitation",
    changes: {
      issuedByUserId: organizationIds.user,
      offeredRoleIds: [organizationIds.role],
      expiresAt: "2026-11-12T09:00:00Z",
      replacesInvitationId: null,
    },
  },
  {
    action: "organization.invitation.reissued",
    targetType: "OrganizationInvitation",
    changes: {
      issuedByUserId: organizationIds.user,
      offeredRoleIds: [organizationIds.role],
      expiresAt: "2026-11-12T09:00:00Z",
      replacesInvitationId: organizationIds.invitation,
    },
  },
  {
    action: "organization.invitation.resent",
    targetType: "OrganizationInvitation",
    changes: {
      issuedByUserId: organizationIds.user,
      offeredRoleIds: [organizationIds.role],
      expiresAt: "2026-11-12T09:00:00Z",
      replacesInvitationId: null,
    },
  },
  {
    action: "organization.invitation.closed",
    targetType: "OrganizationInvitation",
    changes: {
      previousStatus: "pending",
      newStatus: "expired",
      closedByUserId: null,
      closedAt: "2026-11-12T09:00:00Z",
    },
  },
  {
    action: "organization.ownership-nomination.created",
    targetType: "OrganizationOwnershipNomination",
    changes: {
      nominatedByUserId: organizationIds.user,
      previousStatus: null,
      newStatus: "pending",
      expiresAt: "2026-11-12T09:00:00Z",
      closedByUserId: null,
      closedAt: null,
    },
  },
  {
    action: "organization.ownership-nomination.closed",
    targetType: "OrganizationOwnershipNomination",
    changes: {
      nominatedByUserId: organizationIds.user,
      previousStatus: "pending",
      newStatus: "accepted",
      expiresAt: "2026-11-12T09:00:00Z",
      closedByUserId: organizationIds.otherUser,
      closedAt: "2026-11-06T09:00:00Z",
    },
  },
];
