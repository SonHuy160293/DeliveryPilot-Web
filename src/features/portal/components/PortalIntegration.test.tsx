import { act, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { renderRoute } from "@/test/renderRoute";
import { establishOrganizationSession } from "@/test/fixtures/organizationApi";
import {
  prepareCollaboration,
  renderCollaboration,
  collaborationTable,
} from "@/test/fixtures/projectCollaboration";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { ROUTES, portalProjectPath } from "@/lib/routes";
import { firstProject, projectPerson } from "@/test/fixtures/projectMock";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import { getSharingRepository } from "@/features/sharing/api/sharingRepository";
import { organizationIds } from "@/mocks/workspaces";
import { QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "@/app/router";
import { createQueryClient } from "@/lib/query/queryClient";
const id = firstProject.detail.id;
beforeEach(() => {
  __resetMocks();
  establishOrganizationSession();
});
afterEach(__resetMocks);
const forbidden =
  /northwind delivery studio|@|185,000|\bAUD\b|person-days|planned effort|contract amount|contacts|change reason|waiver|pending invitation|no active administrator/i;
describe("client portal", () => {
  it("shows a guest project card and its shared, safe project view", async () => {
    renderRoute(ROUTES.portal);
    const card = await screen.findByRole(
      "heading",
      { name: firstProject.detail.name },
      { timeout: 4000 },
    );
    expect(card).toBeVisible();
    await userEvent.click(screen.getByRole("link", { name: "Open project" }));
    const shared = await screen.findByRole(
      "region",
      { name: "Shared with you" },
      { timeout: 5000 },
    );
    expect(
      within(shared).getByRole("heading", { name: "Problem" }),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Team" }).querySelector("ul"),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).not.toHaveTextContent(forbidden);
    expect(
      screen.queryByRole("button", { name: /Edit/ }),
    ).not.toBeInTheDocument();
  });
  it("permits guest PM edits without exposing private stakeholder fields", async () => {
    __setMockPersona("u-mai");
    const repository = getProjectRepository(),
      people = await repository.listParticipants(
        organizationIds.organization,
        id,
      );
    const guest = people.find(
      (row) => row.userId === projectPerson("u-tomasz").id,
    );
    if (!guest) throw new Error("Missing guest");
    await repository.changeRoles(organizationIds.organization, id, guest.id, {
      roles: ["ProjectManager"],
      expectedVersion: guest.version,
    });
    __setMockPersona("u-tomasz");
    renderRoute(portalProjectPath(id));
    const brief = await screen.findByRole(
        "region",
        { name: "Brief" },
        { timeout: 5000 },
      ),
      user = userEvent.setup();
    await user.click(
      within(brief).getByRole("button", { name: "Edit Problem" }),
    );
    const dialog = within(screen.getByRole("dialog", { name: "Edit Problem" }));
    await user.clear(dialog.getByLabelText("Problem"));
    await user.type(dialog.getByLabelText("Problem"), "Guest contribution");
    await user.click(dialog.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText(
        "Brief updated.",
        { exact: false },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    const stakeholders = screen.getByRole("region", { name: "Stakeholders" });
    expect(
      within(stakeholders).getAllByRole("button", { name: "Edit" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByRole("main")).not.toHaveTextContent(forbidden);
  }, 15000);
  it("uses the same privacy projection in read-only vendor preview", async () => {
    prepareCollaboration();
    renderCollaboration("sharing");
    await collaborationTable("Brief items");
    await userEvent.click(
      screen.getByRole("button", { name: "Preview as client" }),
    );
    const preview = screen.getByRole("region", { name: "Client preview" });
    await within(preview).findByRole(
      "heading",
      { name: "Problem" },
      { timeout: 5000 },
    );
    expect(preview).not.toHaveTextContent(forbidden);
    expect(preview).not.toHaveTextContent(
      firstProject.brief.objectivesAndSuccessCriteria ?? "private",
    );
    expect(
      within(preview).queryByRole("button", { name: /Edit|Leave/ }),
    ).not.toBeInTheDocument();
  });
  it("shows an empty portal for a non-guest and the same unavailable message for unknown and inaccessible projects", async () => {
    __setMockPersona("u-linh");
    const { unmount } = renderRoute(ROUTES.portal);
    expect(
      await screen.findByRole(
        "heading",
        { name: "You haven't been invited to any client projects" },
        { timeout: 4000 },
      ),
    ).toBeVisible();
    unmount();
    renderRoute(portalProjectPath(id));
    expect(
      await screen.findByText(
        "This project isn't available. Your access may have ended.",
        {},
        { timeout: 4000 },
      ),
    ).toBeVisible();
  });
  it("recovers a failed portal list read", async () => {
    __setMockFailure("portal.list", "server");
    renderRoute(ROUTES.portal);
    const retry = await screen.findByRole(
      "button",
      { name: "Retry loading client projects" },
      { timeout: 4000 },
    );
    __setMockFailure("portal.list", null);
    await userEvent.click(retry);
    expect(
      await screen.findByRole(
        "heading",
        { name: firstProject.detail.name },
        { timeout: 4000 },
      ),
    ).toBeVisible();
  });
  it("removes a cached project name and content when a refresh denies access", async () => {
    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[portalProjectPath(id)]}>
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    await screen.findByRole(
      "heading",
      { level: 1, name: firstProject.detail.name },
      { timeout: 5000 },
    );
    __setMockFailure("portal.view", "not-found");
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["account"] });
    });
    expect(
      await screen.findByText(
        "This project isn't available. Your access may have ended.",
      ),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: "Project" }),
    ).toBeVisible();
    expect(
      screen.queryByText(firstProject.detail.name),
    ).not.toBeInTheDocument();
  }, 10000);
  it("keeps roles visible if team-name lookup fails", async () => {
    __setMockFailure("portal.names", "server");
    renderRoute(portalProjectPath(id));
    const team = within(
      await screen.findByRole("region", { name: "Team" }, { timeout: 5000 }),
    );
    const members = team.getAllByRole("listitem");
    expect(
      members.every((row) => row.textContent.includes("Name unavailable")),
    ).toBe(true);
    expect(
      members.some((row) =>
        /Name unavailable\s*—\s*Viewer/.test(row.textContent),
      ),
    ).toBe(true);
  });
  it("shows the shared-items empty state when every share was withdrawn", async () => {
    __setMockPersona("u-linh");
    const sharing = getSharingRepository(),
      rows = await sharing.list(organizationIds.organization, id);
    for (const row of rows.filter((item) => item.status === "Shared"))
      await sharing.withdraw(organizationIds.organization, id, row.id, {
        expectedVersion: row.version,
        reason: null,
      });
    __setMockPersona("u-tomasz");
    renderRoute(portalProjectPath(id));
    expect(
      await screen.findByText(
        "Nothing has been shared with you yet.",
        {},
        { timeout: 5000 },
      ),
    ).toBeVisible();
  }, 10000);
  it("confirms leaving, returns home and removes access", async () => {
    renderRoute(portalProjectPath(id));
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole(
        "button",
        { name: "Leave project" },
        { timeout: 5000 },
      ),
    );
    const dialog = within(screen.getByRole("dialog"));
    expect(
      dialog.getByText("You will lose access to this project immediately."),
    ).toBeVisible();
    await user.click(dialog.getByRole("button", { name: "Leave project" }));
    expect(
      await screen.findByText(
        `You left ${firstProject.detail.name}.`,
        { exact: false },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    await waitFor(
      () =>
        expect(
          screen.getByRole("heading", {
            name: "You haven't been invited to any client projects",
          }),
        ).toBeVisible(),
      { timeout: 5000 },
    );
  }, 10000);
});
