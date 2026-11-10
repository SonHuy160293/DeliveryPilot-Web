import type { Workspace } from "@/features/workspaces/api/contracts";

export type PortfolioTab = "all" | "managed";
export type PortfolioSort = "default" | "name";
export type PortfolioView = "grid" | "list";
export const ALL_ROLES = "all";

/** A presentation filter over returned role badges; it never grants access. */
export function isManagedWorkspace(workspace: Workspace): boolean {
  return workspace.roles.some(
    (role) => role.code === "owner" || role.code === "admin",
  );
}

export function isOwnedWorkspace(workspace: Workspace): boolean {
  return workspace.roles.some((role) => role.code === "owner");
}

/** Below this many workspaces, search, filters and sorting add more weight than help. */
export const PORTFOLIO_TOOLBAR_MIN = 6;

export function formatLoadedCount(count: number, more: boolean): string {
  return `${String(count)}${more ? "+" : ""}`;
}

export function roleNames(workspaces: readonly Workspace[]): string[] {
  const names = new Set(
    workspaces.flatMap((workspace) => workspace.roles.map((role) => role.name)),
  );
  return [...names].sort((a, b) => a.localeCompare(b));
}

export function shapePortfolio(
  workspaces: readonly Workspace[],
  shape: { tab: PortfolioTab; role: string; sort: PortfolioSort; name: string },
): Workspace[] {
  const needle = shape.name.trim().toLocaleLowerCase();
  const visible = workspaces.filter(
    (workspace) =>
      (shape.tab === "all" || isManagedWorkspace(workspace)) &&
      (shape.role === ALL_ROLES ||
        workspace.roles.some((role) => role.name === shape.role)) &&
      workspace.name.toLocaleLowerCase().includes(needle),
  );
  return shape.sort === "name"
    ? visible.sort((a, b) => a.name.localeCompare(b.name))
    : visible;
}
