/** Planning contracts only; no verified Project HTTP endpoint exists. */
import type { EngagementSummary } from "@/features/engagements/api/types";
export interface ProjectOverviewContext {
  people: Record<string, string>;
  engagement: { summary: EngagementSummary; canOpenFullDetail: boolean } | null;
}
/** Internal mock composition read; caller must be an active member participant. */
export interface ProjectSharingSnapshot {
  project: ProjectDetail;
  brief: ProjectBrief;
  stakeholders: Stakeholder[];
}
export type Uuid = string;
export type Instant = string;
export type Version = number;
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
export type RepositoryKind = "mock" | "http";
export type ProjectStatus = "Draft" | "Active";
export type ProjectKind = "Client" | "Internal";
export type ProjectRoleCode =
  | "ProjectAdministrator"
  | "ProjectManager"
  | "BusinessAnalyst"
  | "Developer"
  | "QualityAssurance"
  | "DevOps"
  | "Viewer";
export type ParticipantKind = "Member" | "Guest";
export type ParticipantStatus = "Active" | "Removed" | "Revoked" | "Left";
export type GuestInvitationStatus =
  "Pending" | "Accepted" | "Declined" | "Cancelled" | "Expired";
export type BriefItemCode =
  | "Problem"
  | "ObjectivesAndSuccessCriteria"
  | "ScopeAndExclusions"
  | "Assumptions"
  | "ConstraintsAndDependencies"
  | "OpenQuestions";

export interface ProjectEngagementRef {
  id: Uuid;
  clientDisplayName: string;
  engagementName: string | null;
  agreementReference: string;
}

export interface ProjectListItem {
  /** Computed only for Draft projects whose caller is a Project Administrator. */
  missingSetupCount?: number;
  id: Uuid;
  name: string; // 1–160
  purpose: string; // 1–500
  kind: ProjectKind;
  status: ProjectStatus;
  engagement: ProjectEngagementRef | null;
  sprintLengthWeeks: 1 | 2 | 3 | 4;
  myRoles: ProjectRoleCode[];
  myParticipantKind: ParticipantKind;
  hasActiveAdministrator: boolean;
  createdAt: Instant;
}

export interface ClientPoAssignment {
  participantId: Uuid;
  userId: Uuid;
  displayName: string | null;
  assignedAt: Instant;
  assignedByUserId: Uuid;
}

export interface ProjectDetail extends ProjectListItem {
  clientProductOwner: ClientPoAssignment | null;
  activatedAt: Instant | null;
  activatedByUserId: Uuid | null;
  clientPoWaiverReason: string | null; // ≤2000; shown to all participants, never to guests
  createdByUserId: Uuid;
  updatedAt: Instant;
  version: Version;
  /** caller's computed abilities for UI gating; the server still authorizes every call */
  permissions: ProjectPermissions;
}

export interface ProjectPermissions {
  editBrief: boolean;
  editStakeholders: boolean;
  editCadence: boolean;
  manageParticipants: boolean;
  manageGuests: boolean;
  assignClientPo: boolean;
  activate: boolean;
  manageAdministrators: boolean;
  readHistory: boolean;
  share: boolean;
  changeEngagement: boolean; // PA + organization.engagements.manage + Draft
}

export interface ProjectBrief {
  projectId: Uuid;
  problem: string | null; // each ≤4000; null/"" = missing
  objectivesAndSuccessCriteria: string | null;
  scopeAndExclusions: string | null;
  assumptions: string | null;
  constraintsAndDependencies: string | null;
  openQuestions: string | null;
  productGoal: string | null;
  previousProductGoals: {
    value: string;
    replacedAt: Instant;
    replacedByUserId: Uuid;
  }[];
  updatedAt: Instant | null;
  updatedByUserId: Uuid | null;
  version: Version;
}

export interface Participant {
  id: Uuid;
  userId: Uuid;
  displayName: string | null; // Identity lookup, not stored (OQ-UI-08)
  primaryEmail: string | null; // vendor view only; never in portal
  kind: ParticipantKind;
  status: ParticipantStatus;
  roles: ProjectRoleCode[];
  firstJoinedAt: Instant;
  activeSince: Instant;
  isClientProductOwner: boolean;
  version: Version;
}

export interface GuestInvitation {
  id: Uuid;
  recipientEmail: string;
  offeredRoleCode: Exclude<ProjectRoleCode, "ProjectAdministrator">;
  status: GuestInvitationStatus;
  issuedByUserId: Uuid;
  lastIssuedAt: Instant;
  expiresAt: Instant; // lastIssuedAt + 7 days
  version: Version;
}

export interface ProjectInvitationPreview {
  invitationId: Uuid;
  projectName: string;
  offeredRoleCode: GuestInvitation["offeredRoleCode"];
  inviterDisplayName: string | null;
  expiresAt: Instant;
  version: Version;
}

export interface Stakeholder {
  id: Uuid;
  name: string; // 1–200
  side: "Vendor" | "Client";
  organizationName: string | null; // ≤200
  responsibilities: string | null; // ≤2000
  decisionAreas: string | null; // ≤2000
  email: string | null; // never shown to guests
  participantId: Uuid | null; // never shown to guests
  retiredAt: Instant | null;
  version: Version;
}

export interface ProjectEvent {
  id: Uuid;
  eventType: string;
  actorUserId: Uuid;
  actorDisplayName: string | null;
  occurredAt: Instant;
  reason: string | null;
  summary: string; // UI label computed from eventType + details
}

export interface OrphanedProject {
  id: Uuid;
  name: string;
  status: ProjectStatus;
  candidates: {
    participantId: Uuid;
    displayName: string | null;
    roles: ProjectRoleCode[];
  }[];
}

// ---- Requests [ERD-DERIVED] ----
export interface CreateProjectRequest {
  name: string;
  purpose: string;
  kind: ProjectKind;
  engagementId: Uuid | null; // required when kind = Client
}
export interface UpdateBriefItemRequest {
  expectedVersion: Version;
  item: BriefItemCode | "ProductGoal";
  value: string | null;
}
export interface ActivateProjectRequest {
  expectedVersion: Version;
  clientPoWaiverReason: string | null;
}
/** Mock command outcome; the flag reports an actual sharing change, not a guessed UI result. */
export interface ProjectEngagementChangeResult extends ProjectDetail {
  engagementSummaryWithdrawn: boolean;
}
export interface ActivationRejected {
  gaps: (
    | "ProductGoal"
    | "SprintLength"
    | "ProjectManager"
    | "Engagement"
    | "ClientProductOwnerWaiver"
  )[];
}
