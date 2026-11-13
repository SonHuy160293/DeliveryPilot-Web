import { z } from "zod";
import type {
  EngagementDetail,
  EngagementHistoryEntry,
  CreateEngagementResult,
} from "@/features/engagements/api/types";

export const uuid = z
  .string()
  .regex(/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i)
  .refine((value) => value !== "00000000-0000-0000-0000-000000000000");
export const version = z.number().int().positive().refine(Number.isSafeInteger);
export const instant = z.iso.datetime({ offset: true });
export const calendarDate = z.iso.date(
  "Enter the date the agreement was signed.",
);
export const engagementStatus = z.enum(["Active", "Closed"]);
export const milestoneStatus = z.enum([
  "Planned",
  "Achieved",
  "Missed",
  "Retired",
]);
export const contactRole = z.enum(["ClientProductOwner", "Sponsor", "Other"]);
const name = z.string().trim().min(1).max(200);
const optionalName = z.string().trim().max(200).nullable();
const country = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}$/)
  .nullable();
const documentUrl = z
  .url()
  .max(2000)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  })
  .nullable();
const decimal = (places: number) =>
  z
    .number()
    .nonnegative()
    .refine(
      (value) =>
        Math.abs(value * 10 ** places - Math.round(value * 10 ** places)) <
        0.00001,
    );
export const engagementContact = z.object({
  id: uuid,
  name,
  email: z.email(),
  contactRole,
  createdByUserId: uuid,
  createdAt: instant,
  updatedAt: instant,
  version,
});
export const engagementMilestone = z.object({
  id: uuid,
  name,
  description: z.string().max(2000).nullable(),
  originalTargetDate: calendarDate,
  currentTargetDate: calendarDate,
  status: milestoneStatus,
  createdByUserId: uuid,
  createdAt: instant,
  updatedAt: instant,
  version,
});
export const engagementDetail: z.ZodType<EngagementDetail> = z.object({
  id: uuid,
  organizationId: uuid,
  clientDisplayName: name,
  clientLegalName: optionalName,
  clientCountryCode: country,
  engagementName: optionalName,
  agreementReference: z.string().min(1).max(100),
  agreementSignedOn: calendarDate,
  documentUrl,
  contractAmount: decimal(2).nullable(),
  contractCurrency: z
    .string()
    .regex(/^[A-Z]{3}$/)
    .nullable(),
  plannedEffortPersonDays: decimal(1).nullable(),
  status: engagementStatus,
  closedAt: instant.nullable(),
  closedByUserId: uuid.nullable(),
  clientOrganizationId: uuid.nullable(),
  clientLinkedAt: instant.nullable(),
  clientLinkedByUserId: uuid.nullable(),
  hasOutstandingLinkCode: z.boolean(),
  linkCodeExpiresAt: instant.nullable(),
  createdByUserId: uuid,
  createdAt: instant,
  updatedAt: instant,
  version,
  contacts: z.array(engagementContact),
  milestones: z.array(engagementMilestone),
});
export const engagementHistoryEntry: z.ZodType<EngagementHistoryEntry> =
  z.object({
    id: uuid,
    eventType: z.string(),
    subjectType: z.string(),
    subjectId: uuid,
    actorUserId: uuid,
    actorOrganizationId: uuid,
    occurredAt: instant,
    reason: z.string().nullable(),
    details: z.record(z.string(), z.unknown()),
    engagementVersion: version,
  });
export const engagementPage = z.object({
  items: z.array(engagementDetail),
  nextCursor: z.string().nullable(),
});
export const historyPage = z.object({
  items: z.array(engagementHistoryEntry),
  nextCursor: z.string().nullable(),
});
export const creationSnapshot = z.object({
  id: uuid,
  status: engagementStatus,
  version,
  clientDisplayName: name,
  agreementReference: z.string().min(1).max(100),
  agreementSignedOn: calendarDate,
  clientLegalName: optionalName,
  clientCountryCode: country,
  engagementName: optionalName,
  documentUrl,
  createdAt: instant,
  duplicateAgreementReference: z.boolean(),
});
export const createEngagementResult: z.ZodType<CreateEngagementResult> =
  z.object({ snapshot: creationSnapshot, isReplay: z.boolean() });

export const createEngagementRequest = z
  .object({
    clientDisplayName: z
      .string()
      .trim()
      .min(1, "Enter the client's display name.")
      .max(200, "Use 200 characters or fewer."),
    agreementReference: z
      .string()
      .trim()
      .min(1, "Enter the agreement reference.")
      .max(100, "Use 100 characters or fewer."),
    agreementSignedOn: calendarDate,
    clientLegalName: optionalName.optional(),
    clientCountryCode: country.optional(),
    engagementName: optionalName.optional(),
    documentUrl: documentUrl.optional(),
  })
  .strict();
export const reason = z.string().trim().min(1).max(2000);
export const setContractValueRequest = z
  .object({
    expectedVersion: version,
    contractAmount: decimal(2).nullable(),
    contractCurrency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .nullable(),
    plannedEffortPersonDays: decimal(1).nullable(),
    reason: reason.nullable(),
  })
  .strict()
  .refine(
    (input) => input.contractAmount === null || input.contractCurrency !== null,
    {
      path: ["contractCurrency"],
      message: "Record a currency for the amount.",
    },
  );
export const closeOrReopenRequest = z
  .object({ expectedVersion: version, reason })
  .strict();
export const addMilestoneRequest = z
  .object({
    expectedVersion: version,
    name,
    description: z.string().trim().max(2000).nullable(),
    targetDate: calendarDate,
  })
  .strict();
export const editMilestoneRequest = z
  .object({
    expectedVersion: version,
    name,
    description: z.string().trim().max(2000).nullable(),
  })
  .strict();
export const changeMilestoneDateRequest = z
  .object({ expectedVersion: version, targetDate: calendarDate, reason })
  .strict();
export const changeMilestoneStatusRequest = z
  .object({
    expectedVersion: version,
    status: z.enum(["Achieved", "Missed", "Retired"]),
    reason: reason.nullable(),
  })
  .strict();
export const listParams = z
  .object({
    status: engagementStatus.optional(),
    limit: z.number().int().min(1).max(50).default(50),
    cursor: z.string().nullable().optional(),
  })
  .strict();

/** Planning-only shapes for the explicitly marked contract-pending operations. */
export const updateEngagementDetailsRequest = createEngagementRequest.extend({
  expectedVersion: version,
  reason: reason.nullable(),
});
export const upsertContactRequest = z
  .object({ expectedVersion: version, name, email: z.email(), contactRole })
  .strict();
export const issuedLinkCode = z.object({
  code: z.string().min(1),
  expiresAt: instant,
});
export const linkPreview = z.object({
  engagementName: optionalName,
  clientDisplayName: name,
});
export const linkedEngagement = z.object({
  engagementId: uuid,
  engagementName: optionalName,
  clientDisplayName: name,
  linkedAt: instant,
  version,
});
export const linkedProjectSummary = z.object({
  projectId: uuid,
  name: z.string(),
  status: z.enum(["Draft", "Active"]),
  administratorNames: z.array(z.string().nullable()),
  callerParticipates: z.boolean(),
});
export const engagementSummary = z.object({
  engagementId: uuid,
  clientDisplayName: name,
  engagementName: optionalName,
  agreementReference: z.string().min(1).max(100),
  status: engagementStatus,
  milestones: z.array(
    engagementMilestone.pick({
      id: true,
      name: true,
      description: true,
      originalTargetDate: true,
      currentTargetDate: true,
      status: true,
    }),
  ),
});
