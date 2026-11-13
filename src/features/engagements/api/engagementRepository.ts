import { mockEngagementRepository } from "@/features/engagements/api/mockEngagementRepository";
import type {
  Uuid,
  Page,
  EngagementDetail,
  EngagementHistoryEntry,
  EngagementStatus,
  CreateEngagementRequest,
  CreateEngagementResult,
  SetContractValueRequest,
  CloseOrReopenEngagementRequest,
  AddMilestoneRequest,
  EditMilestoneRequest,
  ChangeMilestoneDateRequest,
  ChangeMilestoneStatusRequest,
  EngagementMilestone,
  UpdateEngagementDetailsRequest,
  UpsertContactRequest,
} from "@/features/engagements/api/types";

export interface EngagementRepository {
  readonly kind: "mock" | "http";
  removeClientLink(
    workspaceId: Uuid,
    id: Uuid,
    expectedVersion: number,
    reason: string | null,
  ): Promise<EngagementDetail>;
  updateDetails(
    workspaceId: Uuid,
    id: Uuid,
    request: UpdateEngagementDetailsRequest,
  ): Promise<EngagementDetail>;
  upsertContact(
    workspaceId: Uuid,
    id: Uuid,
    contactId: Uuid | null,
    request: UpsertContactRequest,
  ): Promise<EngagementDetail>;
  removeContact(
    workspaceId: Uuid,
    id: Uuid,
    contactId: Uuid,
    expectedVersion: number,
  ): Promise<EngagementDetail>;
  capabilities(): Promise<{ create: boolean }>;
  detailCapabilities(): Promise<{
    manage: boolean;
    createProject: boolean;
    people: Record<string, string>;
  }>;
  list(
    workspaceId: Uuid,
    params: {
      status?: EngagementStatus;
      limit?: number;
      cursor?: string | null;
    },
    signal?: AbortSignal,
  ): Promise<Page<EngagementDetail>>;
  get(
    workspaceId: Uuid,
    engagementId: Uuid,
    signal?: AbortSignal,
  ): Promise<EngagementDetail>;
  history(
    workspaceId: Uuid,
    engagementId: Uuid,
    params: { limit?: number; cursor?: string | null },
    signal?: AbortSignal,
  ): Promise<Page<EngagementHistoryEntry>>;
  create(
    workspaceId: Uuid,
    request: CreateEngagementRequest,
    idempotencyKey: string,
  ): Promise<CreateEngagementResult>;
  setContractValue(
    workspaceId: Uuid,
    engagementId: Uuid,
    request: SetContractValueRequest,
  ): Promise<EngagementDetail>;
  close(
    workspaceId: Uuid,
    engagementId: Uuid,
    request: CloseOrReopenEngagementRequest,
  ): Promise<EngagementDetail>;
  reopen(
    workspaceId: Uuid,
    engagementId: Uuid,
    request: CloseOrReopenEngagementRequest,
  ): Promise<EngagementDetail>;
  addMilestone(
    workspaceId: Uuid,
    engagementId: Uuid,
    request: AddMilestoneRequest,
  ): Promise<EngagementMilestone>;
  editMilestone(
    workspaceId: Uuid,
    engagementId: Uuid,
    milestoneId: Uuid,
    request: EditMilestoneRequest,
  ): Promise<EngagementMilestone>;
  changeMilestoneDate(
    workspaceId: Uuid,
    engagementId: Uuid,
    milestoneId: Uuid,
    request: ChangeMilestoneDateRequest,
  ): Promise<EngagementMilestone>;
  changeMilestoneStatus(
    workspaceId: Uuid,
    engagementId: Uuid,
    milestoneId: Uuid,
    request: ChangeMilestoneStatusRequest,
  ): Promise<EngagementMilestone>;
}

/** Switch this provider only after an HTTP endpoint and DTO are verified. */
export function getEngagementRepository(): EngagementRepository {
  return mockEngagementRepository;
}
