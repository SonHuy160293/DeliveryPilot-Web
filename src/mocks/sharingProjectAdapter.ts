import {
  getProjectRepository,
  getProjectSharingSnapshot,
} from "@/features/projects/api/projectRepository";
import type { SharingProjectAdapter } from "@/features/sharing/api/types";
export const sharingProjectAdapter: SharingProjectAdapter = {
  read: getProjectSharingSnapshot,
  async canReadEngagement(workspaceId, id, signal) {
    const context = await getProjectRepository().overviewContext(
      workspaceId,
      id,
      signal,
    );
    return context.engagement?.canOpenFullDetail === true;
  },
};
