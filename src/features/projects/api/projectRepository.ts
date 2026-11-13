import type {
  Uuid,
  Version,
  RepositoryKind,
  Page,
  ProjectListItem,
  ProjectDetail,
  ProjectBrief,
  CreateProjectRequest,
  UpdateBriefItemRequest,
  ActivateProjectRequest,
  ProjectEvent,
  Participant,
  ProjectRoleCode,
  GuestInvitation,
  Stakeholder,
  OrphanedProject,
  ProjectKind,
  ProjectOverviewContext,
  ProjectEngagementChangeResult,
  ProjectEngagementRef,
} from "@/features/projects/api/types";
import { createMockProjectRepository } from "@/features/projects/api/mockProjectRepository";
import { projectEngagementAdapter } from "@/mocks/projectEngagementAdapter";
export interface ProjectRepository {
  settingsContext(
    workspaceId: Uuid,
    projectId: Uuid,
    signal?: AbortSignal,
  ): Promise<{ people: Record<string, string> }>;
  engagementOptions(
    workspaceId: Uuid,
    projectId: Uuid,
    signal?: AbortSignal,
  ): Promise<ProjectEngagementRef[]>;
  teamContext(
    workspaceId: Uuid,
    projectId: Uuid,
    signal?: AbortSignal,
  ): Promise<{ engagementDefaultParticipantIds: string[] }>;
  overviewContext(
    workspaceId: Uuid,
    projectId: Uuid,
    signal?: AbortSignal,
  ): Promise<ProjectOverviewContext>;
  readonly kind: RepositoryKind;
  creationOptions(
    workspaceId: Uuid,
    signal?: AbortSignal,
  ): Promise<{
    create: boolean;
    engagements: import("@/features/projects/api/types").ProjectEngagementRef[];
  }>;
  listMine(workspaceId: Uuid, signal?: AbortSignal): Promise<ProjectListItem[]>;
  get(
    workspaceId: Uuid,
    projectId: Uuid,
    signal?: AbortSignal,
  ): Promise<ProjectDetail>;
  create(
    workspaceId: Uuid,
    request: CreateProjectRequest,
    idempotencyKey: string,
  ): Promise<ProjectDetail>;
  getBrief(
    workspaceId: Uuid,
    projectId: Uuid,
    signal?: AbortSignal,
  ): Promise<ProjectBrief>;
  updateBriefItem(
    workspaceId: Uuid,
    projectId: Uuid,
    request: UpdateBriefItemRequest,
  ): Promise<ProjectBrief>;
  setSprintLength(
    workspaceId: Uuid,
    projectId: Uuid,
    weeks: 1 | 2 | 3 | 4,
    expectedVersion: Version,
  ): Promise<ProjectDetail>;
  changeEngagement(
    workspaceId: Uuid,
    projectId: Uuid,
    request: {
      expectedVersion: Version;
      kind: ProjectKind;
      engagementId: Uuid | null;
      reason: string;
    },
  ): Promise<ProjectEngagementChangeResult>;
  activate(
    workspaceId: Uuid,
    projectId: Uuid,
    request: ActivateProjectRequest,
  ): Promise<ProjectDetail>;
  history(
    workspaceId: Uuid,
    projectId: Uuid,
    params: { cursor?: string | null },
    signal?: AbortSignal,
  ): Promise<Page<ProjectEvent>>;
  // team
  listParticipants(
    workspaceId: Uuid,
    projectId: Uuid,
    signal?: AbortSignal,
  ): Promise<Participant[]>;
  addParticipant(
    workspaceId: Uuid,
    projectId: Uuid,
    request: { userId: Uuid; roles: ProjectRoleCode[] },
  ): Promise<Participant>;
  changeRoles(
    workspaceId: Uuid,
    projectId: Uuid,
    participantId: Uuid,
    request: { roles: ProjectRoleCode[]; expectedVersion: Version },
  ): Promise<Participant>;
  endParticipation(
    workspaceId: Uuid,
    projectId: Uuid,
    participantId: Uuid,
    request: { expectedVersion: Version; reason: string | null },
  ): Promise<void>; // remove member / revoke guest
  leave(projectId: Uuid): Promise<void>; // guest
  assignClientPo(
    workspaceId: Uuid,
    projectId: Uuid,
    participantId: Uuid | null,
    expectedVersion: Version,
  ): Promise<ProjectDetail>;
  // guest invitations
  listInvitations(
    workspaceId: Uuid,
    projectId: Uuid,
    signal?: AbortSignal,
  ): Promise<GuestInvitation[]>;
  inviteGuest(
    workspaceId: Uuid,
    projectId: Uuid,
    request: {
      recipientEmail: string;
      offeredRoleCode: GuestInvitation["offeredRoleCode"];
    },
  ): Promise<GuestInvitation>;
  resendInvitation(
    workspaceId: Uuid,
    projectId: Uuid,
    invitationId: Uuid,
    expectedVersion: Version,
  ): Promise<GuestInvitation>;
  cancelInvitation(
    workspaceId: Uuid,
    projectId: Uuid,
    invitationId: Uuid,
    expectedVersion: Version,
  ): Promise<GuestInvitation>;
  // stakeholders
  listStakeholders(
    workspaceId: Uuid,
    projectId: Uuid,
    includeRetired: boolean,
    signal?: AbortSignal,
  ): Promise<Stakeholder[]>;
  saveStakeholder(
    workspaceId: Uuid,
    projectId: Uuid,
    stakeholderId: Uuid | null,
    request: Omit<Stakeholder, "id" | "retiredAt">,
  ): Promise<Stakeholder>;
  retireStakeholder(
    workspaceId: Uuid,
    projectId: Uuid,
    stakeholderId: Uuid,
    expectedVersion: Version,
  ): Promise<void>;
  // recovery (Owner)
  listOrphaned(
    workspaceId: Uuid,
    signal?: AbortSignal,
  ): Promise<OrphanedProject[]>;
  appointAdministrator(
    workspaceId: Uuid,
    projectId: Uuid,
    request: { participantId: Uuid; reason: string },
  ): Promise<void>;
}
const repository = createMockProjectRepository(projectEngagementAdapter);
export function getProjectRepository(): ProjectRepository {
  return repository;
}
export const getProjectRecipientRepository = () => repository.recipient;
export const getMockPortalProjectBridge = () => repository;
export const getProjectSharingSnapshot = (workspaceId: string, id: string) =>
  repository.sharingSnapshot(workspaceId, id);
