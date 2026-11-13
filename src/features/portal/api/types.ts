import type {
  BriefItemCode,
  ProjectRoleCode,
  ProjectStatus,
  ProjectBrief,
  Stakeholder,
  UpdateBriefItemRequest,
} from "@/features/projects/api/types";
export interface GuestProjectListItem {
  projectId: string;
  name: string;
  status: ProjectStatus;
  myRoles: Exclude<ProjectRoleCode, "ProjectAdministrator">[];
  isClientProductOwner: boolean;
  admittedAt: string;
}
export interface PortalMilestone {
  id: string;
  name: string;
  originalTargetDate: string;
  currentTargetDate: string;
  status: string;
}
export interface GuestProjectView {
  projectId: string;
  name: string;
  purpose: string;
  status: ProjectStatus;
  sprintLengthWeeks: 1 | 2 | 3 | 4;
  productGoal: string | null;
  myRoles: Exclude<ProjectRoleCode, "ProjectAdministrator">[];
  clientProductOwnerName: string | null;
  team: {
    displayName: string | null;
    roles: ProjectRoleCode[];
    isGuest: boolean;
    isClientProductOwner: boolean;
  }[];
  sharedBriefItems: {
    code: BriefItemCode;
    value: string | null;
    sharedAt: string;
  }[];
  sharedStakeholders: {
    id: string;
    name: string;
    side: "Vendor" | "Client";
    organizationName: string | null;
    responsibilities: string | null;
    decisionAreas: string | null;
    sharedAt: string;
  }[];
  sharedEngagementSummary: {
    clientDisplayName: string;
    engagementName: string | null;
    agreementReference: string;
    status: string;
    milestones: PortalMilestone[];
    sharedAt: string;
  } | null;
  roleAccess: { editBrief: boolean; editStakeholders: boolean };
  editableBrief?: ProjectBrief;
  editableStakeholders?: Omit<Stakeholder, "email" | "participantId">[];
}
export interface PortalAdapter {
  list(): Promise<GuestProjectListItem[]>;
  view(projectId: string, signal?: AbortSignal): Promise<GuestProjectView>;
  preview(
    workspaceId: string,
    projectId: string,
    signal?: AbortSignal,
  ): Promise<GuestProjectView>;
  updateBrief(
    projectId: string,
    request: UpdateBriefItemRequest,
  ): Promise<void>;
  updateStakeholder(
    projectId: string,
    stakeholderId: string,
    request: Pick<
      Stakeholder,
      | "name"
      | "side"
      | "organizationName"
      | "responsibilities"
      | "decisionAreas"
      | "version"
    >,
  ): Promise<void>;
  leave(projectId: string): Promise<void>;
}
