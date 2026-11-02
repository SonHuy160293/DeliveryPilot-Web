import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { AppRoutes } from "@/app/router";
import { createQueryClient } from "@/lib/query/queryClient";
import { ROUTES, workspaceOverviewPath } from "@/lib/routes";
import {
  organizationFixtures as f,
  organizationIds as ids,
} from "@/mocks/workspaces";
import { server } from "@/test/mocks/server";
import {
  apiBase,
  establishOrganizationSession,
  failure,
  organizationReadHandlers,
  paged,
  success,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";

describe("WorkspacesPage organization portfolio", () => {
  beforeEach(() => {
    establishOrganizationSession();
    server.use(...organizationReadHandlers);
  });

  it("renders authenticated organization discovery header, search, and organization cards with initials", async () => {
    server.use(
      http.get(`${apiBase}/me/organizations`, () =>
        success(
          paged([
            {
              ...f.workspace,
              name: "Aurora Digital",
              roles: [
                { id: ids.ownerRole, code: "owner", name: "PortfolioOwner" },
              ],
            },
            {
              ...f.workspace,
              organizationId: ids.otherOrganization,
              name: "Northstar",
              roles: [
                { id: ids.memberRole, code: "member", name: "DeliveryLead" },
              ],
            },
          ]),
        ),
      ),
    );

    renderOrganizationRoute(ROUTES.workspaces);

    const workspacesRegion = await screen.findByRole("region", {
      name: "Workspaces",
    });
    expect(
      within(workspacesRegion).getByRole("heading", {
        level: 1,
        name: "Workspaces",
      }),
    ).toBeVisible();
    expect(
      within(workspacesRegion).getByRole("button", {
        name: "Create workspace",
      }),
    ).toBeVisible();
    expect(screen.queryByText("Your workspaces")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Everything you need to move between the teams you work with.",
      ),
    ).not.toBeInTheDocument();

    expect(
      await within(workspacesRegion).findByText("Aurora Digital"),
    ).toBeVisible();
    expect(within(workspacesRegion).getByText("All (2)")).toBeVisible();
    expect(within(workspacesRegion).getByText("AD")).toBeVisible();
    expect(within(workspacesRegion).getByText("Northstar")).toBeVisible();
    expect(within(workspacesRegion).getByText("N")).toBeVisible();
    expect(
      within(workspacesRegion).queryByText("Bring another team on board"),
    ).not.toBeInTheDocument();

    expect(
      within(workspacesRegion).getByRole("link", {
        name: "Open workspace Aurora Digital",
      }),
    ).toHaveAttribute("href", workspaceOverviewPath(ids.organization));
    expect(
      within(workspacesRegion).getByRole("link", {
        name: "Open workspace Northstar",
      }),
    ).toHaveAttribute("href", workspaceOverviewPath(ids.otherOrganization));

    // Verify role badges, member counts, latest access, and delivery pulse are omitted from cards
    expect(screen.queryByText("PortfolioOwner")).not.toBeInTheDocument();
    expect(screen.queryByText("DeliveryLead")).not.toBeInTheDocument();
    expect(
      within(workspacesRegion).queryByText(/\bmembers\b/i),
    ).not.toBeInTheDocument();
    expect(
      within(workspacesRegion).queryByText(/latest access/i),
    ).not.toBeInTheDocument();
    expect(
      within(workspacesRegion).queryByText(/last activity/i),
    ).not.toBeInTheDocument();
    expect(
      within(workspacesRegion).queryByText(/delivery pulse/i),
    ).not.toBeInTheDocument();
    expect(
      within(workspacesRegion).queryByText(/accessible projects/i),
    ).not.toBeInTheDocument();
  });

  it("filters loaded organizations case-insensitively and handles no matching loaded results", async () => {
    server.use(
      http.get(`${apiBase}/me/organizations`, () =>
        success(
          paged([
            {
              ...f.workspace,
              name: "Aurora Digital",
            },
            {
              ...f.workspace,
              organizationId: ids.otherOrganization,
              name: "Vertex Partners",
            },
          ]),
        ),
      ),
    );

    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    const workspacesRegion = screen.getByRole("region", { name: "Workspaces" });

    expect(
      await within(workspacesRegion).findByText("Aurora Digital"),
    ).toBeVisible();
    expect(within(workspacesRegion).getByText("Vertex Partners")).toBeVisible();

    const searchInput = within(workspacesRegion).getByLabelText(
      "Filter loaded workspaces",
    );
    await user.type(searchInput, "  vErTeX  ");

    expect(
      within(workspacesRegion).queryByText("Aurora Digital"),
    ).not.toBeInTheDocument();
    expect(within(workspacesRegion).getByText("Vertex Partners")).toBeVisible();

    await user.clear(searchInput);
    await user.type(searchInput, "Nonexistent Org");

    expect(
      within(workspacesRegion).getByText(
        "No matching loaded workspaces. Try another name.",
      ),
    ).toBeVisible();
  });

  it("prompts to load more when filtering yields no match on partial pages and loads next page", async () => {
    server.use(
      http.get(`${apiBase}/me/organizations`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        return success(
          cursor
            ? paged([
                {
                  ...f.workspace,
                  organizationId: ids.otherOrganization,
                  name: "CloudNine Studio",
                },
              ])
            : paged([{ ...f.workspace, name: "Aurora Digital" }], "cursor-2"),
        );
      }),
    );

    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    const workspacesRegion = screen.getByRole("region", { name: "Workspaces" });

    expect(
      await within(workspacesRegion).findByText("Aurora Digital"),
    ).toBeVisible();

    await user.type(
      within(workspacesRegion).getByLabelText("Filter loaded workspaces"),
      "cloudnine",
    );
    expect(
      within(workspacesRegion).getByText(
        "No matching loaded workspaces. Load more workspaces to continue.",
      ),
    ).toBeVisible();

    await user.click(
      within(workspacesRegion).getByRole("button", { name: "Load more" }),
    );
    expect(
      await within(workspacesRegion).findByText("CloudNine Studio"),
    ).toBeVisible();
    expect(within(workspacesRegion).getByText("CS")).toBeVisible();
  });

  it("renders empty workspace collection state and opens create dialog with focus restoration", async () => {
    server.use(
      http.get(`${apiBase}/me/organizations`, () => success(paged([]))),
      http.get(`${apiBase}/me/ownership-nominations`, () => success(paged([]))),
    );

    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();

    expect(
      await screen.findByRole("heading", { name: "No workspaces yet" }),
    ).toBeVisible();
    expect(
      screen.queryByLabelText("Filter loaded workspaces"),
    ).not.toBeInTheDocument();

    const emptyAction = screen.getByRole("button", {
      name: "Create your first workspace",
    });
    await user.click(emptyAction);

    const dialog = screen.getByRole("dialog", { name: "Create workspace" });
    expect(dialog).toBeVisible();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(emptyAction).toHaveFocus();
    });
  });

  it("navigates to workspace overview when clicking Open workspace", async () => {
    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();

    const openLink = await screen.findByRole("link", {
      name: `Open workspace ${f.workspace.name}`,
    });
    await user.click(openLink);

    expect(
      await screen.findByRole("heading", { name: f.workspace.name }),
    ).toBeVisible();
    expect(await screen.findByRole("tab", { name: "Overview" })).toBeVisible();
  });

  it("displays workspace access-denied feedback when redirected with workspaceDenied state", async () => {
    const client = createQueryClient();
    client.setDefaultOptions({
      queries: { retry: false, staleTime: 60_000, refetchOnWindowFocus: false },
    });

    render(
      <QueryClientProvider client={client}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: ROUTES.workspaces,
              state: { workspaceDenied: true },
            },
          ]}
        >
          <AppRoutes />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText(
        /The selected workspace is unavailable under your current membership/,
      ),
    ).toBeVisible();
  });

  it("renders error state and allows retrying discovery", async () => {
    let shouldFail = true;
    server.use(
      http.get(`${apiBase}/me/organizations`, () =>
        shouldFail
          ? failure(503, "Organization.AuthorityUnavailable")
          : success(paged([f.workspace])),
      ),
    );

    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    const workspacesRegion = screen.getByRole("region", { name: "Workspaces" });

    expect(
      await within(workspacesRegion).findByText(
        /The request could not be completed/,
      ),
    ).toBeVisible();

    shouldFail = false;
    await user.click(
      within(workspacesRegion).getByRole("button", {
        name: "Retry loading workspaces",
      }),
    );

    expect(
      await within(workspacesRegion).findByRole("link", {
        name: `Open workspace ${f.workspace.name}`,
      }),
    ).toBeVisible();
  });

  it("preserves personal ownership nominations section", async () => {
    renderOrganizationRoute(ROUTES.workspaces);

    const nominationsRegion = await screen.findByRole("region", {
      name: "Your Owner nominations",
    });
    expect(nominationsRegion).toBeVisible();
    expect(
      await within(nominationsRegion).findByRole("button", {
        name: "Accept Owner nomination",
      }),
    ).toBeVisible();
  });
});
