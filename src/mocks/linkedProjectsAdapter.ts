import { getMockPortalProjectBridge } from "@/features/projects/api/projectRepository";
export const linkedProjectProjection = (
  workspaceId: string,
  engagementId: string,
) =>
  getMockPortalProjectBridge().linkedProjectProjection(
    workspaceId,
    engagementId,
  );
