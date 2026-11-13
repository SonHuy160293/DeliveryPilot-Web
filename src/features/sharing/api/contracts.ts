import { z } from "zod";
export const briefItemCode = z.enum([
  "Problem",
  "ObjectivesAndSuccessCriteria",
  "ScopeAndExclusions",
  "Assumptions",
  "ConstraintsAndDependencies",
  "OpenQuestions",
]);
export const shareItemType = z.enum([
  "BriefItem",
  "Stakeholder",
  "EngagementSummary",
]);
export const shareableItem = z
  .object({
    itemType: shareItemType,
    briefItemCode: briefItemCode.optional(),
    stakeholderId: z.uuid().optional(),
  })
  .strict()
  .superRefine((item, ctx) => {
    if (
      (item.itemType === "BriefItem") !== !!item.briefItemCode ||
      (item.itemType === "Stakeholder") !== !!item.stakeholderId
    )
      ctx.addIssue({ code: "custom", message: "Choose a shareable item." });
  });
export const guestShare = z.object({
  id: z.uuid(),
  itemType: shareItemType,
  briefItemCode: briefItemCode.nullable(),
  stakeholderId: z.uuid().nullable(),
  engagementId: z.uuid().nullable(),
  status: z.enum(["Shared", "Withdrawn"]),
  sharedAt: z.iso.datetime().nullable(),
  sharedByUserId: z.uuid().nullable(),
  withdrawnAt: z.iso.datetime().nullable(),
  version: z.number().int().positive(),
});
export const shareEvent = z.object({
  id: z.uuid(),
  action: z.enum(["Shared", "Withdrawn"]),
  itemType: shareItemType,
  itemLabel: z.string(),
  actorUserId: z.uuid(),
  actorDisplayName: z.string().nullable(),
  occurredAt: z.iso.datetime(),
  reason: z.string().nullable(),
});
export const withdrawal = z
  .object({
    expectedVersion: z.number().int().positive(),
    reason: z.string().trim().max(1000).nullable(),
  })
  .strict();
