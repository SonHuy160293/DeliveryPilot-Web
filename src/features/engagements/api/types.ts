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

/** Planning-only project status used by the ERD-derived linked-project summary. */
export type ProjectStatus = "Draft" | "Active";

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
  expectedVersion: Version;
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
