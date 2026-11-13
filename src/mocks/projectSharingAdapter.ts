import { mockEngagementSummaryShares } from "@/features/sharing/api/mockEngagementSummaryShares";
import type { ProjectSharingAdapter } from "@/features/projects/api/sharingAdapter";
export const projectSharingAdapter: ProjectSharingAdapter = {
  withdrawStakeholder: (input) =>
    mockEngagementSummaryShares.withdrawStakeholder(input),
  withdrawEngagementSummary: (input) =>
    mockEngagementSummaryShares.withdrawEngagementSummary(input),
};
