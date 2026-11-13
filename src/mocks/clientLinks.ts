import type {
  LinkedEngagement,
  LinkPreview,
} from "@/features/engagements/api/types";
/** Fictional records copied from client-links-and-recovery.json. */
export const mockLinkCode = "7KQ4-MZ2P-H9TD";
export const mockLinkSource = {
  workspaceId: "019a1000-0000-7000-8000-000000000001",
  engagementId: "019a3000-0000-7000-8000-000000000002",
  expiresAt: "2026-11-18T03:30:00Z",
};
export const mockLinkPreview: LinkPreview = {
  engagementName: "Fleet telemetry MVP",
  clientDisplayName: "Halden Logistics",
};
export const mockLinkedEngagements: readonly LinkedEngagement[] = [
  {
    engagementId: "019a3000-0000-7000-8000-000000000001",
    engagementName: "Loyalty platform rebuild",
    clientDisplayName: "Larkspur Retail Group",
    linkedAt: "2026-09-20T02:40:00Z",
    version: 7,
  },
];
