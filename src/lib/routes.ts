import { generatePath } from "react-router";
import { projectTabSearch, type ProjectTab } from "@/lib/projectTabs";

/** Approved routes. Feature agents must not invent paths outside this file. */
export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  workspaces: "/workspaces",
  workspaceOverview: "/w/:workspaceSlug",
  joinWorkspace: "/join-workspace",
  workspaceEngagements: "/w/:workspaceSlug/engagements",
  workspaceEngagement: "/w/:workspaceSlug/engagements/:engagementId",
  workspaceProjects: "/w/:workspaceSlug/projects",
  workspaceProject: "/w/:workspaceSlug/projects/:projectId",
  joinProject: "/join-project",
  portal: "/portal",
  portalProject: "/portal/projects/:projectId",
  notFound: "*",
} as const;

export type RouteName = keyof typeof ROUTES;

export function workspaceOverviewPath(workspaceSlug: string): string {
  return generatePath(ROUTES.workspaceOverview, { workspaceSlug });
}

export function workspaceEngagementsPath(workspaceId: string): string {
  return generatePath(ROUTES.workspaceEngagements, {
    workspaceSlug: workspaceId,
  });
}

export function workspaceEngagementPath(
  workspaceId: string,
  engagementId: string,
): string {
  return generatePath(ROUTES.workspaceEngagement, {
    workspaceSlug: workspaceId,
    engagementId,
  });
}

export function workspaceProjectsPath(workspaceId: string): string {
  return generatePath(ROUTES.workspaceProjects, { workspaceSlug: workspaceId });
}

export function workspaceProjectPath(
  workspaceId: string,
  projectId: string,
  tab?: ProjectTab,
): string {
  return `${generatePath(ROUTES.workspaceProject, { workspaceSlug: workspaceId, projectId })}${tab ? projectTabSearch(tab) : ""}`;
}

export function portalProjectPath(projectId: string): string {
  return generatePath(ROUTES.portalProject, { projectId });
}

export function isUuid(value: string): boolean {
  return (
    value.length === 36 &&
    /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value)
  );
}

/** A navigation allowlist only; the membership API still authorizes workspace access. */
export function isWorkspaceOverviewPath(path: string): boolean {
  const workspaceId = /^\/w\/([^/]+)$/.exec(path)?.[1];
  return workspaceId !== undefined && isUuid(workspaceId);
}
