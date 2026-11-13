import type {
  ProjectRoleCode,
  BriefItemCode,
} from "@/features/projects/api/types";
export const roles: Record<ProjectRoleCode, string> = {
  ProjectAdministrator: "Project admin",
  ProjectManager: "PM",
  BusinessAnalyst: "BA",
  Developer: "Developer",
  QualityAssurance: "QA",
  DevOps: "DevOps",
  Viewer: "Viewer",
};
export const briefLabels: Record<BriefItemCode, string> = {
  Problem: "Problem",
  ObjectivesAndSuccessCriteria: "Objectives and success criteria",
  ScopeAndExclusions: "Scope and exclusions",
  Assumptions: "Assumptions",
  ConstraintsAndDependencies: "Constraints and dependencies",
  OpenQuestions: "Open questions",
};
export const briefFields = {
  Problem: "problem",
  ObjectivesAndSuccessCriteria: "objectivesAndSuccessCriteria",
  ScopeAndExclusions: "scopeAndExclusions",
  Assumptions: "assumptions",
  ConstraintsAndDependencies: "constraintsAndDependencies",
  OpenQuestions: "openQuestions",
} as const;
