import type { ProjectInvitationPreviewResult } from "@/features/projects/guest-invitations/recipient/types";
import { mockProjectInvitationResponseRepository } from "@/features/projects/guest-invitations/recipient/mockProjectInvitationResponseRepository";
export interface ProjectInvitationResponseRepository {
  readonly kind: "mock" | "http";
  preview(
    invitationId: string,
    proof: string,
    signal?: AbortSignal,
  ): Promise<ProjectInvitationPreviewResult>;
  accept(
    invitationId: string,
    proof: string,
    expectedVersion: number,
    signal?: AbortSignal,
  ): Promise<{ projectId: string }>;
  decline(
    invitationId: string,
    proof: string,
    expectedVersion: number,
    signal?: AbortSignal,
  ): Promise<void>;
}
export const getProjectInvitationResponseRepository =
  (): ProjectInvitationResponseRepository =>
    mockProjectInvitationResponseRepository;
