import {
  createMockShareStore,
  mockShareStore,
} from "@/features/sharing/api/mockShareStore";
import { shareFixtureProjectId } from "@/mocks/portal";
/** Compatibility projection for the existing project engagement-change adapter. */
export function createMockEngagementSummaryShares(
  store = createMockShareStore(),
) {
  return {
    withdrawEngagementSummary: store.withdrawEngagementSummary,
    withdrawStakeholder: store.withdrawStakeholder,
    snapshot(workspaceId: string) {
      const state = store.project(workspaceId, shareFixtureProjectId);
      return structuredClone({
        shares: state.shares.filter(
          (row) => row.itemType === "EngagementSummary",
        ),
        history: state.history.filter(
          (row) =>
            row.itemType === "EngagementSummary" && row.action === "Withdrawn",
        ),
      });
    },
  };
}
export const mockEngagementSummaryShares =
  createMockEngagementSummaryShares(mockShareStore);
