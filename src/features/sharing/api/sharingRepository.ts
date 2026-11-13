import type {
  GuestShare,
  ShareableItem,
  ShareEvent,
  SharingContext,
} from "@/features/sharing/api/types";
import { createMockSharingRepository } from "@/features/sharing/api/mockSharingRepository";
import { sharingProjectAdapter } from "@/mocks/sharingProjectAdapter";
export interface SharingRepository {
  readonly kind: "mock" | "http";
  list(
    workspaceId: string,
    projectId: string,
    signal?: AbortSignal,
  ): Promise<GuestShare[]>;
  context(
    workspaceId: string,
    projectId: string,
    signal?: AbortSignal,
  ): Promise<SharingContext>;
  share(
    workspaceId: string,
    projectId: string,
    item: ShareableItem,
  ): Promise<GuestShare>;
  withdraw(
    workspaceId: string,
    projectId: string,
    shareId: string,
    request: { expectedVersion: number; reason: string | null },
  ): Promise<GuestShare>;
  history(
    workspaceId: string,
    projectId: string,
    params: { cursor?: string | null },
    signal?: AbortSignal,
  ): Promise<{ items: ShareEvent[]; nextCursor: string | null }>;
}
const repository = createMockSharingRepository(sharingProjectAdapter);
export const getSharingRepository = (): SharingRepository => repository;
