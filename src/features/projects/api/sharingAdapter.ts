/** Internal composition boundary; call only after project authorization and version checks. */
export interface ProjectSharingAdapter {
  withdrawStakeholder(input: {
    workspaceId: string;
    projectId: string;
    stakeholderId: string;
    name: string;
    actorUserId: string;
    actorDisplayName: string;
    reason: string | null;
  }): boolean;
  withdrawEngagementSummary(input: {
    workspaceId: string;
    projectId: string;
    engagementId: string | null;
    actorUserId: string;
    actorDisplayName: string;
    reason: string;
  }): boolean;
}
