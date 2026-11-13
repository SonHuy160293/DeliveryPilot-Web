import type { ProjectInvitationPreview } from "@/features/projects/api/types";
/** Owner-approved mock presentation metadata; not a verified HTTP DTO. */
export type ProjectInvitationPreviewResult =
  | {
      kind: "preview";
      preview: ProjectInvitationPreview & {
        replacesFormerMembership?: boolean;
      };
    }
  | { kind: "already-guest"; projectId: string; projectName: string };
