import type { ComponentType } from "react";
import type { ProjectScope } from "@/features/projects/api/queries";
import type { ProjectDetail } from "@/features/projects/api/types";
export interface ProjectTeamProps {
  scope: ProjectScope;
  project: ProjectDetail;
  onSuccess: (message: string) => void;
  onUnavailable: (error: unknown) => void;
}
export type ProjectTeamComponent = ComponentType<ProjectTeamProps>;
export interface WorkspaceMemberOption {
  userId: string;
  displayName: string;
  primaryEmail: string;
}
export interface TeamMembersRead {
  items: WorkspaceMemberOption[];
  loading: boolean;
  denied: boolean;
  error: unknown;
  more: boolean;
  fetching: boolean;
  retry: () => void;
  loadMore: () => void;
}
