import { z } from "zod";
import type {
  ProjectDetail,
  ProjectBrief,
  Participant,
  Stakeholder,
  GuestInvitation,
  ProjectEvent,
} from "@/features/projects/api/types";
export const uuid = z
  .string()
  .regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i)
  .refine((value) => value !== "00000000-0000-0000-0000-000000000000");
export const version = z.number().int().positive().refine(Number.isSafeInteger);
const instant = z.iso.datetime({ offset: true });
const nullableText = z.string().nullable();
export const projectStatus = z.enum(["Draft", "Active"]);
export const projectKind = z.enum(["Client", "Internal"]);
export const roleCode = z.enum([
  "ProjectAdministrator",
  "ProjectManager",
  "BusinessAnalyst",
  "Developer",
  "QualityAssurance",
  "DevOps",
  "Viewer",
]);
export const guestRoleCode = roleCode.exclude(["ProjectAdministrator"]);
export const roles = z
  .array(roleCode)
  .min(
    1,
    "Choose at least one role. To remove the person, use Remove from project.",
  )
  .refine((values) => new Set(values).size === values.length);
export const sprintLength = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export const briefItemCode = z.enum([
  "Problem",
  "ObjectivesAndSuccessCriteria",
  "ScopeAndExclusions",
  "Assumptions",
  "ConstraintsAndDependencies",
  "OpenQuestions",
  "ProductGoal",
]);
export const reason = z
  .string()
  .trim()
  .min(1, "Enter a reason.")
  .max(2000, "Use 2,000 characters or fewer.");
const name = z
  .string()
  .trim()
  .min(1, "Enter a project name.")
  .max(160, "Use 160 characters or fewer.");
const purpose = z
  .string()
  .trim()
  .min(1, "Describe the project's purpose.")
  .max(500, "Use 500 characters or fewer.");
export const engagementRef = z.object({
  id: uuid,
  clientDisplayName: z.string(),
  engagementName: nullableText,
  agreementReference: z.string(),
});
export const projectPermissions = z.object({
  editBrief: z.boolean(),
  editStakeholders: z.boolean(),
  editCadence: z.boolean(),
  manageParticipants: z.boolean(),
  manageGuests: z.boolean(),
  assignClientPo: z.boolean(),
  activate: z.boolean(),
  manageAdministrators: z.boolean(),
  readHistory: z.boolean(),
  share: z.boolean(),
  changeEngagement: z.boolean(),
});
export const projectListItem = z.object({
  id: uuid,
  name,
  purpose,
  kind: projectKind,
  status: projectStatus,
  engagement: engagementRef.nullable(),
  sprintLengthWeeks: sprintLength,
  myRoles: z.array(roleCode),
  myParticipantKind: z.enum(["Member", "Guest"]),
  hasActiveAdministrator: z.boolean(),
  createdAt: instant,
  missingSetupCount: z.number().int().nonnegative().optional(),
});
export const clientPoAssignment = z.object({
  participantId: uuid,
  userId: uuid,
  displayName: nullableText,
  assignedAt: instant,
  assignedByUserId: uuid,
});
export const projectDetail: z.ZodType<ProjectDetail> = projectListItem.extend({
  clientProductOwner: clientPoAssignment.nullable(),
  activatedAt: instant.nullable(),
  activatedByUserId: uuid.nullable(),
  clientPoWaiverReason: z.string().max(2000).nullable(),
  createdByUserId: uuid,
  updatedAt: instant,
  version,
  permissions: projectPermissions,
});
const briefText = z.string().max(4000).nullable();
export const projectBrief: z.ZodType<ProjectBrief> = z.object({
  projectId: uuid,
  problem: briefText,
  objectivesAndSuccessCriteria: briefText,
  scopeAndExclusions: briefText,
  assumptions: briefText,
  constraintsAndDependencies: briefText,
  openQuestions: briefText,
  productGoal: briefText,
  previousProductGoals: z.array(
    z.object({
      value: z.string().max(4000),
      replacedAt: instant,
      replacedByUserId: uuid,
    }),
  ),
  updatedAt: instant.nullable(),
  updatedByUserId: uuid.nullable(),
  version,
});
export const participant: z.ZodType<Participant> = z
  .object({
    id: uuid,
    userId: uuid,
    displayName: nullableText,
    primaryEmail: z.email().nullable(),
    kind: z.enum(["Member", "Guest"]),
    status: z.enum(["Active", "Removed", "Revoked", "Left"]),
    roles: z.array(roleCode),
    firstJoinedAt: instant,
    activeSince: instant,
    isClientProductOwner: z.boolean(),
    version,
  })
  .refine(
    (item) =>
      item.kind !== "Guest" || !item.roles.includes("ProjectAdministrator"),
  );
export const guestInvitation: z.ZodType<GuestInvitation> = z.object({
  id: uuid,
  recipientEmail: z.email().max(320),
  offeredRoleCode: guestRoleCode,
  status: z.enum(["Pending", "Accepted", "Declined", "Cancelled", "Expired"]),
  issuedByUserId: uuid,
  lastIssuedAt: instant,
  expiresAt: instant,
  version,
});
export const stakeholder: z.ZodType<Stakeholder> = z.object({
  id: uuid,
  name: z.string().trim().min(1).max(200),
  side: z.enum(["Vendor", "Client"]),
  organizationName: z.string().max(200).nullable(),
  responsibilities: z.string().max(2000).nullable(),
  decisionAreas: z.string().max(2000).nullable(),
  email: z.email().max(320).nullable(),
  participantId: uuid.nullable(),
  retiredAt: instant.nullable(),
  version,
});
export const projectEvent: z.ZodType<ProjectEvent> = z.object({
  id: uuid,
  eventType: z.string(),
  actorUserId: uuid,
  actorDisplayName: nullableText,
  occurredAt: instant,
  reason: nullableText,
  summary: z.string(),
});
export const orphanedProject = z.object({
  id: uuid,
  name: z.string(),
  status: projectStatus,
  candidates: z.array(
    z.object({
      participantId: uuid,
      displayName: nullableText,
      roles: z.array(roleCode),
    }),
  ),
});
export const createProjectRequest = z
  .object({ name, purpose, kind: projectKind, engagementId: uuid.nullable() })
  .strict()
  .refine(
    (input) =>
      input.kind === "Client"
        ? input.engagementId !== null
        : input.engagementId === null,
    {
      path: ["engagementId"],
      message: "Choose the engagement this project delivers.",
    },
  );
export const updateBriefItemRequest = z
  .object({
    expectedVersion: version,
    item: briefItemCode,
    value: z.string().trim().max(4000).nullable(),
  })
  .strict();
export const activateProjectRequest = z
  .object({ expectedVersion: version, clientPoWaiverReason: reason.nullable() })
  .strict();
export const changeEngagementRequest = z
  .object({
    expectedVersion: version,
    kind: projectKind,
    engagementId: uuid.nullable(),
    reason,
  })
  .strict()
  .refine(
    (input) =>
      input.kind === "Client"
        ? input.engagementId !== null
        : input.engagementId === null,
    {
      path: ["engagementId"],
      message: "Choose the engagement this project delivers.",
    },
  );
export const addParticipantRequest = z.object({ userId: uuid, roles }).strict();
export const changeRolesRequest = z
  .object({ roles, expectedVersion: version })
  .strict();
export const endParticipationRequest = z
  .object({ expectedVersion: version, reason: reason.nullable() })
  .strict();
export const inviteGuestRequest = z
  .object({
    recipientEmail: z.string().trim().toLowerCase().pipe(z.email().max(320)),
    offeredRoleCode: guestRoleCode,
  })
  .strict();
export const saveStakeholderRequest = z
  .object({
    name: z.string().trim().min(1).max(200),
    side: z.enum(["Vendor", "Client"]),
    organizationName: z.string().trim().max(200).nullable(),
    responsibilities: z.string().trim().max(2000).nullable(),
    decisionAreas: z.string().trim().max(2000).nullable(),
    email: z.email().max(320).nullable(),
    participantId: uuid.nullable(),
    version,
  })
  .strict();
export const appointAdministratorRequest = z
  .object({ participantId: uuid, reason })
  .strict();
export const invitationPreview = z.object({
  invitationId: uuid,
  projectName: z.string(),
  offeredRoleCode: guestRoleCode,
  inviterDisplayName: nullableText,
  expiresAt: instant,
  version,
});
/** Project participants receive only this allowlisted engagement projection. */
export const projectOverviewContext = z.object({
  people: z.record(z.string(), z.string()),
  engagement: z
    .object({
      canOpenFullDetail: z.boolean(),
      summary: z.object({
        engagementId: uuid,
        clientDisplayName: z.string(),
        engagementName: nullableText,
        agreementReference: z.string(),
        status: z.enum(["Active", "Closed"]),
        milestones: z.array(
          z.object({
            id: uuid,
            name: z.string(),
            description: nullableText,
            originalTargetDate: z.iso.date(),
            currentTargetDate: z.iso.date(),
            status: z.enum(["Planned", "Missed", "Achieved", "Retired"]),
          }),
        ),
      }),
    })
    .nullable(),
});
