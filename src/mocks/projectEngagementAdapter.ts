import { mockEngagementRepository } from "@/features/engagements/api/mockEngagementRepository";
import type { ProjectEngagementAdapter } from "@/features/projects/api/engagementAdapter";
/** Explicitly approved mock composition bridge. It retains engagement read authorization. */
export const projectEngagementAdapter: ProjectEngagementAdapter = {
  clientPoMatches: (workspaceId, id, candidates, signal) =>
    mockEngagementRepository.projectClientPoMatches(
      workspaceId,
      id,
      candidates,
      signal,
    ),
  getSummary: (workspaceId, id, signal) =>
    mockEngagementRepository.projectSummary(workspaceId, id, signal),
  async listVisible(workspaceId, signal) {
    const rows = [];
    let cursor: string | null | undefined;
    do {
      const page = await mockEngagementRepository.list(
        workspaceId,
        { status: "Active", cursor, limit: 50 },
        signal,
      );
      rows.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor);
    return rows;
  },
  getVisible: (workspaceId, id, signal) =>
    mockEngagementRepository.get(workspaceId, id, signal),
};
