import { getMockPortalProjectBridge } from "@/features/projects/api/projectRepository";
import { projectEngagementAdapter } from "@/mocks/projectEngagementAdapter";
import { mockShareStore } from "@/features/sharing/api/mockShareStore";
import { SHARE_BRIEF_ITEMS } from "@/features/sharing/model/items";
import type {
  PortalAdapter,
  GuestProjectView,
} from "@/features/portal/api/types";
import type { ProjectRoleCode } from "@/features/projects/api/types";
type BridgeSnapshot = ReturnType<
  ReturnType<typeof getMockPortalProjectBridge>["portalSnapshot"]
>;
function guestRoles(
  roles: ProjectRoleCode[],
): Exclude<ProjectRoleCode, "ProjectAdministrator">[] {
  return roles.filter(
    (role): role is Exclude<ProjectRoleCode, "ProjectAdministrator"> =>
      role !== "ProjectAdministrator",
  );
}
async function projectView(
  read: () => BridgeSnapshot,
  preview: boolean,
  signal?: AbortSignal,
): Promise<GuestProjectView> {
  const initial = read(),
    { workspaceId } = initial,
    first = initial.record;
  const summaryShare = mockShareStore
    .project(workspaceId, first.detail.id)
    .shares.find(
      (row) =>
        row.status === "Shared" &&
        row.itemType === "EngagementSummary" &&
        row.engagementId === first.detail.engagement?.id,
    );
  const summary =
    summaryShare && first.detail.engagement
      ? (
          await projectEngagementAdapter.getSummary(
            workspaceId,
            first.detail.engagement.id,
            signal,
          )
        ).summary
      : null;
  const latest = read(),
    { record, participant } = latest,
    shares = mockShareStore
      .project(workspaceId, record.detail.id)
      .shares.filter((row) => row.status === "Shared" && row.sharedAt);
  const activeSummary = shares.find(
    (row) =>
      row.itemType === "EngagementSummary" &&
      row.engagementId === record.detail.engagement?.id &&
      row.id === summaryShare?.id &&
      row.version === summaryShare.version,
  );
  const editBrief =
    !preview &&
    participant.roles.some(
      (role) => role === "ProjectManager" || role === "BusinessAnalyst",
    );
  const editStakeholders =
    !preview && participant.roles.includes("ProjectManager");
  return {
    projectId: record.detail.id,
    name: record.detail.name,
    purpose: record.detail.purpose,
    status: record.detail.status,
    sprintLengthWeeks: record.detail.sprintLengthWeeks,
    productGoal: record.brief.productGoal,
    myRoles: preview ? [] : guestRoles(participant.roles),
    clientProductOwnerName:
      record.detail.clientProductOwner?.displayName ?? null,
    team: record.participants
      .filter((row) => row.status === "Active")
      .map((row) => ({
        displayName: row.displayName,
        roles: [...row.roles],
        isGuest: row.kind === "Guest",
        isClientProductOwner: row.isClientProductOwner,
      })),
    sharedBriefItems: shares.flatMap((row) => {
      const item = SHARE_BRIEF_ITEMS.find(
        (item) => item.code === row.briefItemCode,
      );
      return row.itemType === "BriefItem" && item && row.sharedAt
        ? [
            {
              code: item.code,
              value: record.brief[item.field],
              sharedAt: row.sharedAt,
            },
          ]
        : [];
    }),
    sharedStakeholders: shares.flatMap((row) => {
      const item = record.stakeholders.find(
        (item) => item.id === row.stakeholderId && !item.retiredAt,
      );
      return row.itemType === "Stakeholder" && item && row.sharedAt
        ? [
            {
              id: item.id,
              name: item.name,
              side: item.side,
              organizationName:
                item.side === "Vendor" ? null : item.organizationName,
              responsibilities: item.responsibilities,
              decisionAreas: item.decisionAreas,
              sharedAt: row.sharedAt,
            },
          ]
        : [];
    }),
    sharedEngagementSummary:
      activeSummary?.sharedAt && summary
        ? {
            clientDisplayName: summary.clientDisplayName,
            engagementName: summary.engagementName,
            agreementReference: summary.agreementReference,
            status: summary.status,
            milestones: summary.milestones.map((item) => ({
              id: item.id,
              name: item.name,
              originalTargetDate: item.originalTargetDate,
              currentTargetDate: item.currentTargetDate,
              status: item.status,
            })),
            sharedAt: activeSummary.sharedAt,
          }
        : null,
    roleAccess: { editBrief, editStakeholders },
    ...(editBrief ? { editableBrief: structuredClone(record.brief) } : {}),
    ...(editStakeholders
      ? {
          editableStakeholders: record.stakeholders
            .filter((row) => !row.retiredAt)
            .map((row) => ({
              id: row.id,
              name: row.name,
              side: row.side,
              organizationName:
                row.side === "Vendor" ? null : row.organizationName,
              responsibilities: row.responsibilities,
              decisionAreas: row.decisionAreas,
              retiredAt: row.retiredAt,
              version: row.version,
            })),
        }
      : {}),
  };
}
export const portalMockAdapter: PortalAdapter = {
  list() {
    return Promise.resolve(
      getMockPortalProjectBridge()
        .portalList()
        .map(({ record, participant }) => ({
          projectId: record.detail.id,
          name: record.detail.name,
          status: record.detail.status,
          myRoles: guestRoles(participant.roles),
          isClientProductOwner: participant.isClientProductOwner,
          admittedAt: participant.activeSince,
        })),
    );
  },
  view(id, signal) {
    return projectView(
      () => getMockPortalProjectBridge().portalSnapshot(id),
      false,
      signal,
    );
  },
  preview(wid, id, signal) {
    return projectView(
      () => getMockPortalProjectBridge().portalPreviewSnapshot(wid, id),
      true,
      signal,
    );
  },
  updateBrief(id, request) {
    return getMockPortalProjectBridge().portalUpdateBrief(id, request);
  },
  updateStakeholder(id, stakeholderId, request) {
    return getMockPortalProjectBridge().portalUpdateStakeholder(
      id,
      stakeholderId,
      request,
    );
  },
  leave(id) {
    return getMockPortalProjectBridge().leave(id);
  },
};
