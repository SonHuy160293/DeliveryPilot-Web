import { matchPath } from "react-router";
import { describe, expect, it } from "vitest";
import {
  ROUTES,
  isUuid,
  isWorkspaceOverviewPath,
  workspaceOverviewPath,
  workspaceEngagementsPath,
  workspaceEngagementPath,
  workspaceProjectsPath,
  workspaceProjectPath,
  portalProjectPath,
} from "@/lib/routes";

const workspaceId = "00000000-0000-0000-0000-000000000001";
const resourceId = "abcdef01-2345-6789-abcd-ef0123456789";

describe("approved path helpers", () => {
  it.each([
    [
      ROUTES.workspaceOverview,
      workspaceOverviewPath(workspaceId),
      { workspaceSlug: workspaceId },
    ],
    [
      ROUTES.workspaceEngagements,
      workspaceEngagementsPath(workspaceId),
      { workspaceSlug: workspaceId },
    ],
    [
      ROUTES.workspaceEngagement,
      workspaceEngagementPath(workspaceId, resourceId),
      { workspaceSlug: workspaceId, engagementId: resourceId },
    ],
    [
      ROUTES.workspaceProjects,
      workspaceProjectsPath(workspaceId),
      { workspaceSlug: workspaceId },
    ],
    [
      ROUTES.workspaceProject,
      workspaceProjectPath(workspaceId, resourceId),
      { workspaceSlug: workspaceId, projectId: resourceId },
    ],
    [
      ROUTES.portalProject,
      portalProjectPath(resourceId),
      { projectId: resourceId },
    ],
  ])("generates %s with its complete parameters", (pattern, path, params) => {
    expect(matchPath(pattern, path)?.params).toEqual(params);
    expect(path).not.toContain(":");
  });
  it("omits the default project tab and appends a selected tab", () => {
    const base = workspaceProjectPath(workspaceId, resourceId);
    expect(workspaceProjectPath(workspaceId, resourceId, "overview")).toBe(
      base,
    );
    expect(workspaceProjectPath(workspaceId, resourceId, "sharing")).toBe(
      `${base}?tab=sharing`,
    );
  });
});

describe("UUID navigation validation", () => {
  it.each([workspaceId, resourceId, resourceId.toUpperCase()])(
    "accepts the existing UUID format: %s",
    (value) => {
      expect(isUuid(value)).toBe(true);
      expect(isWorkspaceOverviewPath(workspaceOverviewPath(value))).toBe(true);
    },
  );
  it.each([
    "",
    "unverified-slug",
    resourceId.slice(1),
    `${resourceId}0`,
    `${resourceId}\n`,
    ` ${resourceId}`,
    resourceId.replace("a", "g"),
    resourceId.replaceAll("-", ""),
  ])("rejects malformed UUIDs: %s", (value) => {
    expect(isUuid(value)).toBe(false);
    if (value)
      expect(isWorkspaceOverviewPath(workspaceOverviewPath(value))).toBe(false);
  });
  it("keeps the workspace navigation allowlist scoped to the overview only", () => {
    expect(isWorkspaceOverviewPath(workspaceProjectsPath(workspaceId))).toBe(
      false,
    );
    expect(
      isWorkspaceOverviewPath(`${workspaceOverviewPath(workspaceId)}/`),
    ).toBe(false);
    expect(
      isWorkspaceOverviewPath(
        `${workspaceOverviewPath(workspaceId)}?section=members`,
      ),
    ).toBe(false);
    expect(isWorkspaceOverviewPath(ROUTES.portal)).toBe(false);
  });
});
