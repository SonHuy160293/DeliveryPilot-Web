import type { ProjectRoleCode } from "@/features/projects/api/types";
export const PROJECT_ROLE_LABELS = {
  ProjectAdministrator: "Project admin",
  ProjectManager: "PM",
  BusinessAnalyst: "BA",
  Developer: "Developer",
  QualityAssurance: "QA",
  DevOps: "DevOps",
  Viewer: "Viewer",
} as const satisfies Readonly<Record<ProjectRoleCode, string>>;
export const projectRoleLabel = (role: ProjectRoleCode) =>
  PROJECT_ROLE_LABELS[role];
