# Type definitions (planning copy)

These TypeScript definitions are kept in Markdown on purpose: a `.ts` file under `docs/` would be linted by the type-aware ESLint config but belongs to no tsconfig. Coding agents copy them into `src/features/<feature>/api/types.ts` and add matching Zod schemas in `contracts.ts` (existing convention: runtime-checked wire contracts, see `src/features/workspaces/api/contracts.ts`).

Provenance tags:

- **[DTO]** taken from backend C# records (verified source path given).
- **[ERD-DERIVED]** from `docs/architecture/modules/projects/erd.md` + FRs; no DTO exists yet (G7). Re-verify when endpoints land.
- **[ASSUMPTION]** wire casing: camelCase properties (ASP.NET default), status strings as the domain constants (PascalCase) — G9.

## Shared primitives

```ts
/** UUID string, validated with the existing `uuid` Zod schema. */
export type Uuid = string;
/** ISO 8601 instant with offset, e.g. "2026-11-04T03:02:00Z". */
export type Instant = string;
/** Calendar date "YYYY-MM-DD" (C# DateOnly). Display as "4 Nov 2026" (UTC). */
export type CalendarDate = string;
/** Optimistic-concurrency version (C# long). */
export type Version = number;

/** [DTO] EngagementPage<T> — DeliveryPilot.Projects.Application/.../Queries/EngagementPage.cs */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
```

## Engagement — FEAT-DP-025

```ts
export type EngagementStatus = "Active" | "Closed";
export type MilestoneStatus = "Planned" | "Achieved" | "Missed" | "Retired";
export type ContactRole = "ClientProductOwner" | "Sponsor" | "Other"; // [ASSUMPTION] string values; FR-025-005 names the three roles

/** [DTO] EngagementContactView */
export interface EngagementContact {
  id: Uuid;
  name: string; // 1–200
  email: string;
  contactRole: ContactRole;
  createdByUserId: Uuid;
  createdAt: Instant;
  updatedAt: Instant;
  version: Version;
}

/** [DTO] EngagementMilestoneView */
export interface EngagementMilestone {
  id: Uuid;
  name: string; // 1–200
  description: string | null; // ≤2000
  originalTargetDate: CalendarDate; // never changes
  currentTargetDate: CalendarDate;
  status: MilestoneStatus;
  createdByUserId: Uuid;
  createdAt: Instant;
  updatedAt: Instant;
  version: Version;
}

/** [DTO] EngagementDetail — Queries/EngagementDetail.cs. Returned by list and get (full-detail tier). */
export interface EngagementDetail {
  id: Uuid;
  organizationId: Uuid;
  clientDisplayName: string; // 1–200
  clientLegalName: string | null; // ≤200
  clientCountryCode: string | null; // ISO 3166-1 alpha-2
  engagementName: string | null; // ≤200
  agreementReference: string; // 1–100
  agreementSignedOn: CalendarDate;
  documentUrl: string | null; // https, ≤2000
  contractAmount: number | null; // ≥0, ≤2 dp — keep as number; format with Intl
  contractCurrency: string | null; // ISO 4217
  plannedEffortPersonDays: number | null; // ≥0, ≤1 dp
  status: EngagementStatus;
  closedAt: Instant | null;
  closedByUserId: Uuid | null;
  clientOrganizationId: Uuid | null; // never displayed
  clientLinkedAt: Instant | null;
  clientLinkedByUserId: Uuid | null;
  hasOutstandingLinkCode: boolean;
  linkCodeExpiresAt: Instant | null;
  createdByUserId: Uuid;
  createdAt: Instant;
  updatedAt: Instant;
  version: Version;
  contacts: EngagementContact[];
  milestones: EngagementMilestone[];
}

/** [DTO] CreateEngagementResult { Snapshot, IsReplay } */
export interface CreateEngagementResult {
  snapshot: {
    id: Uuid;
    status: EngagementStatus;
    version: Version;
    clientDisplayName: string;
    agreementReference: string;
    agreementSignedOn: CalendarDate;
    clientLegalName: string | null;
    clientCountryCode: string | null;
    engagementName: string | null;
    documentUrl: string | null;
    createdAt: Instant;
    duplicateAgreementReference: boolean;
  };
  isReplay: boolean;
}

/** [DTO] EngagementHistoryEntry */
export interface EngagementHistoryEntry {
  id: Uuid;
  eventType: string; // map to labels; unknown → "Engagement updated"
  subjectType: string;
  subjectId: Uuid;
  actorUserId: Uuid;
  actorOrganizationId: Uuid;
  occurredAt: Instant;
  reason: string | null;
  details: Record<string, unknown>; // render known keys only
  engagementVersion: Version;
}

// ---- Requests [DTO] (API/Contracts/Engagements/*.cs) ----
export interface CreateEngagementRequest {
  clientDisplayName: string;
  agreementReference: string;
  agreementSignedOn: CalendarDate;
  clientLegalName?: string | null;
  clientCountryCode?: string | null;
  engagementName?: string | null;
  documentUrl?: string | null;
}
export interface SetContractValueRequest {
  expectedVersion: Version;
  contractAmount: number | null;
  contractCurrency: string | null;
  plannedEffortPersonDays: number | null;
  reason: string | null;
}
export interface CloseOrReopenEngagementRequest {
  expectedVersion: Version;
  reason: string;
}
export interface AddMilestoneRequest {
  name: string;
  description: string | null;
  targetDate: CalendarDate;
}
export interface EditMilestoneRequest {
  expectedVersion: Version;
  name: string;
  description: string | null;
}
export interface ChangeMilestoneDateRequest {
  expectedVersion: Version;
  targetDate: CalendarDate;
  reason: string;
}
export interface ChangeMilestoneStatusRequest {
  expectedVersion: Version;
  status: Exclude<MilestoneStatus, "Planned">;
  reason: string | null;
}

// ---- Contract pending (G6) [ERD-DERIVED] ----
export interface UpdateEngagementDetailsRequest extends CreateEngagementRequest {
  expectedVersion: Version;
  reason: string | null; // required when agreementReference/agreementSignedOn change
}
export interface UpsertContactRequest {
  expectedVersion: Version;
  name: string;
  email: string;
  contactRole: ContactRole;
}
export interface IssuedLinkCode {
  code: string; // shown once, never cached
  expiresAt: Instant;
}
export interface LinkPreview {
  engagementName: string | null;
  clientDisplayName: string;
}
export interface LinkedEngagement {
  engagementId: Uuid;
  engagementName: string | null;
  clientDisplayName: string;
  linkedAt: Instant;
  version: Version;
}

/** [ERD-DERIVED] FR-025-006 full detail: projects under the engagement (G8). */
export interface LinkedProjectSummary {
  projectId: Uuid;
  name: string;
  status: ProjectStatus;
  administratorNames: (string | null)[];
  callerParticipates: boolean;
}

/** [ERD-DERIVED] FR-025-006 summary tier for linked-project participants. */
export interface EngagementSummary {
  engagementId: Uuid;
  clientDisplayName: string;
  engagementName: string | null;
  agreementReference: string;
  status: EngagementStatus;
  milestones: Pick<
    EngagementMilestone,
    | "id"
    | "name"
    | "description"
    | "originalTargetDate"
    | "currentTargetDate"
    | "status"
  >[];
}
```

## Project — FEAT-DP-004 [ERD-DERIVED]

```ts
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
export interface ActivationRejected {
  gaps: (
    | "ProductGoal"
    | "SprintLength"
    | "ProjectManager"
    | "Engagement"
    | "ClientProductOwnerWaiver"
  )[];
}
```

## Sharing and portal — FEAT-DP-015 [ERD-DERIVED]

```ts
export type ShareItemType = "BriefItem" | "Stakeholder" | "EngagementSummary";
export type ShareStatus = "Shared" | "Withdrawn";

export interface GuestShare {
  id: Uuid;
  itemType: ShareItemType;
  briefItemCode: BriefItemCode | null;
  stakeholderId: Uuid | null;
  engagementId: Uuid | null;
  status: ShareStatus;
  sharedAt: Instant | null;
  sharedByUserId: Uuid | null;
  withdrawnAt: Instant | null;
  version: Version;
}

export interface ShareEvent {
  id: Uuid;
  action: "Shared" | "Withdrawn";
  itemType: ShareItemType;
  itemLabel: string;
  actorUserId: Uuid;
  actorDisplayName: string | null;
  occurredAt: Instant;
  reason: string | null;
}

/** FR-015-001 — one row per active guest participation. No vendor workspace name. */
export interface GuestProjectListItem {
  projectId: Uuid;
  name: string;
  status: ProjectStatus;
  myRoles: Exclude<ProjectRoleCode, "ProjectAdministrator">[];
  isClientProductOwner: boolean;
  admittedAt: Instant;
}

/** FR-015-002/005/006 — everything a guest may read about one project. */
export interface GuestProjectView {
  projectId: Uuid;
  name: string;
  purpose: string;
  status: ProjectStatus;
  sprintLengthWeeks: 1 | 2 | 3 | 4;
  productGoal: string | null;
  myRoles: Exclude<ProjectRoleCode, "ProjectAdministrator">[];
  clientProductOwnerName: string | null;
  team: {
    displayName: string | null;
    roles: ProjectRoleCode[];
    isGuest: boolean;
    isClientProductOwner: boolean;
  }[];
  sharedBriefItems: {
    code: BriefItemCode;
    value: string | null;
    sharedAt: Instant;
  }[];
  sharedStakeholders: {
    id: Uuid;
    name: string;
    side: "Vendor" | "Client";
    organizationName: string | null;
    responsibilities: string | null;
    decisionAreas: string | null;
    sharedAt: Instant;
  }[];
  sharedEngagementSummary: (EngagementSummary & { sharedAt: Instant }) | null;
  /** role-granted access (guest PM/BA brief, guest PM stakeholders) */
  roleAccess: { editBrief: boolean; editStakeholders: boolean };
}
```

## Mock-layer metadata

```ts
/** Every repository exposes its kind so pages render MockDataBanner (UI-STA-04). */
export type RepositoryKind = "mock" | "http";
```
