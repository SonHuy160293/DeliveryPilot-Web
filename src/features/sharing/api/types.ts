import type {
  BriefItemCode,
  ProjectDetail,
  ProjectBrief,
  Stakeholder,
} from "@/features/projects/api/types";
export type ShareItemType = "BriefItem" | "Stakeholder" | "EngagementSummary";
export interface ShareableItem {
  itemType: ShareItemType;
  briefItemCode?: BriefItemCode;
  stakeholderId?: string;
}
export interface GuestShare {
  id: string;
  itemType: ShareItemType;
  briefItemCode: BriefItemCode | null;
  stakeholderId: string | null;
  engagementId: string | null;
  status: "Shared" | "Withdrawn";
  sharedAt: string | null;
  sharedByUserId: string | null;
  withdrawnAt: string | null;
  version: number;
}
export interface ShareEvent {
  id: string;
  action: "Shared" | "Withdrawn";
  itemType: ShareItemType;
  itemLabel: string;
  actorUserId: string;
  actorDisplayName: string | null;
  occurredAt: string;
  reason: string | null;
}
export interface SharingProjectSnapshot {
  project: ProjectDetail;
  brief: ProjectBrief;
  stakeholders: Stakeholder[];
}
export interface SharingContext extends SharingProjectSnapshot {
  canShareEngagement: boolean;
  people: Record<string, string>;
}
/** Injected at the composition boundary; sharing imports no project behavior. */
export interface SharingProjectAdapter {
  read(workspaceId: string, projectId: string): SharingProjectSnapshot;
  canReadEngagement(
    workspaceId: string,
    projectId: string,
    signal?: AbortSignal,
  ): Promise<boolean>;
}
