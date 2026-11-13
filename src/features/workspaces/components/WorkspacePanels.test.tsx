import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { workspaceOverviewPath } from "@/lib/routes";
import { workspaceSectionSearch } from "@/lib/workspaceSections";
import { organizationIds } from "@/mocks/workspaces";
import {
  establishOrganizationSession,
  organizationReadHandlers,
} from "@/test/fixtures/organizationApi";
import { server } from "@/test/mocks/server";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";

describe("workspace sections", () => {
  it.each([
    ["client-links", "Client links"],
    ["projects-recovery", "Project recovery"],
  ] as const)(
    "renders %s after workspace admission",
    async (section, title) => {
      establishOrganizationSession();
      __resetMocks();
      __setMockPersona("u-mai");
      server.use(...organizationReadHandlers);
      renderOrganizationRoute(
        `${workspaceOverviewPath(organizationIds.organization)}${workspaceSectionSearch(section)}`,
      );
      expect(
        await screen.findByRole("heading", { level: 2, name: title }),
      ).toBeVisible();
      expect(
        await screen.findByText(/Sample data. This page is not connected/),
      ).toBeVisible();
      expect(screen.getByRole("link", { name: title })).toHaveAttribute(
        "aria-current",
        "page",
      );
    },
  );
});
