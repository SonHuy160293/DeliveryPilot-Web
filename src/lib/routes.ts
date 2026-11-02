import { generatePath } from "react-router";

/** Approved routes. Feature agents must not invent paths outside this file. */
export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  workspaces: "/workspaces",
  workspaceOverview: "/w/:workspaceSlug",
  joinWorkspace: "/join-workspace",
  notFound: "*",
} as const;

export type RouteName = keyof typeof ROUTES;

export function workspaceOverviewPath(workspaceSlug: string): string {
  return generatePath(ROUTES.workspaceOverview, { workspaceSlug });
}

/** A navigation allowlist only; the membership API still authorizes workspace access. */
export function isWorkspaceOverviewPath(path: string): boolean {
  return /^\/w\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(
    path,
  );
}
