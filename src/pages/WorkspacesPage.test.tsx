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

/** Search, filters and sorting appear from six workspaces; these pad a fixture past that threshold. */
const fillers = Array.from({ length: 4 }, (_, index) => ({
  ...f.workspace,
  organizationId: `11111111-1111-4111-8111-11111111111${String(index)}`,
  name: `Filler team ${String(index + 1)}`,
  roles: [{ id: ids.memberRole, code: "member", name: "Member" }],
}));

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
            ...fillers,
          ]),
        ),
      ),
    );

    renderOrganizationRoute(ROUTES.workspaces);

    const workspacesRegion = await screen.findByRole("region", {
      name: "Workspaces",
    });
    expect(
      screen.getByRole("heading", { level: 1, name: "Your workspaces" }),
    ).toBeVisible();
    expect(
      within(workspacesRegion).getByRole("heading", {
        level: 2,
        name: "Workspaces",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Create workspace" }),
    ).toBeVisible();

    expect(
      await within(workspacesRegion).findByText("Aurora Digital"),
    ).toBeVisible();
    const allFilter = within(workspacesRegion).getByRole("button", {
      name: /^All ?6$/,
    });
    expect(allFilter).toHaveAttribute("aria-pressed", "true");
    expect(
      within(workspacesRegion).getByRole("button", {
        name: /^Managed by me ?1$/,
      }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(within(workspacesRegion).getByText("AD")).toBeVisible();
    expect(within(workspacesRegion).getByText("Northstar")).toBeVisible();
    expect(within(workspacesRegion).getByText("N")).toBeVisible();
    expect(
      within(workspacesRegion).getByRole("button", {
        name: /Add another workspace/,
      }),
    ).toBeVisible();

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

    // Cards show returned role badges; unsupported counters and telemetry stay omitted
    expect(within(workspacesRegion).getByText("PortfolioOwner")).toBeVisible();
    expect(within(workspacesRegion).getByText("DeliveryLead")).toBeVisible();
    const summary = screen.getByRole("region", { name: "Portfolio summary" });
    expect(within(summary).getByText("My workspaces")).toBeVisible();
    expect(within(summary).getByText("6")).toBeVisible();
    expect(within(summary).getByText("Managed by me")).toBeVisible();
    expect(screen.queryByText(/accessible projects/i)).not.toBeInTheDocument();
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

  it("narrows to managed workspaces, switches layout, and clears filters", async () => {
    server.use(
      http.get(`${apiBase}/me/organizations`, () =>
        success(
          paged([
            { ...f.workspace, name: "Aurora Digital" },
            {
              ...f.workspace,
              organizationId: ids.otherOrganization,
              name: "Northstar",
              roles: [{ id: ids.memberRole, code: "member", name: "Member" }],
            },
            ...fillers,
          ]),
        ),
      ),
    );

    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    const workspacesRegion = screen.getByRole("region", { name: "Workspaces" });
    expect(
      await within(workspacesRegion).findByText("Northstar"),
    ).toBeVisible();

    await user.click(
      within(workspacesRegion).getByRole("button", {
        name: /^Managed by me ?1$/,
      }),
    );
    expect(within(workspacesRegion).getByText("Aurora Digital")).toBeVisible();
    expect(
      within(workspacesRegion).queryByText("Northstar"),
    ).not.toBeInTheDocument();
    expect(
      within(workspacesRegion).queryByRole("button", {
        name: /Add another workspace/,
      }),
    ).not.toBeInTheDocument();

    const listView = within(workspacesRegion).getByRole("button", {
      name: "List view",
    });
    await user.click(listView);
    expect(listView).toHaveAttribute("aria-pressed", "true");

    await user.type(
      within(workspacesRegion).getByLabelText("Search workspaces"),
      "zzz",
    );
    await user.click(
      within(workspacesRegion).getByRole("button", { name: "Clear filters" }),
    );
    expect(within(workspacesRegion).getByText("Northstar")).toBeVisible();
    expect(listView).toHaveAttribute("aria-pressed", "true");
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
            ...fillers,
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

    const searchInput =
      within(workspacesRegion).getByLabelText("Search workspaces");
    await user.type(searchInput, "  vErTeX  ");

    expect(
      within(workspacesRegion).queryByText("Aurora Digital"),
    ).not.toBeInTheDocument();
    expect(within(workspacesRegion).getByText("Vertex Partners")).toBeVisible();

    await user.clear(searchInput);
    await user.type(searchInput, "Nonexistent Org");

    expect(
      within(workspacesRegion).getByText(
        "No matching workspaces. Try another name.",
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
      within(workspacesRegion).getByLabelText("Search workspaces"),
      "cloudnine",
    );
    expect(
      within(workspacesRegion).getByText(
        "No matching workspaces. Load more workspaces to continue.",
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
      screen.queryByLabelText("Search workspaces"),
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

  it("keeps the portfolio uncluttered until there are enough workspaces to filter", async () => {
    renderOrganizationRoute(ROUTES.workspaces);
    const workspacesRegion = await screen.findByRole("region", {
      name: "Workspaces",
    });
    expect(
      await within(workspacesRegion).findByRole("link", {
        name: `Open workspace ${f.workspace.name}`,
      }),
    ).toBeVisible();
    expect(
      within(workspacesRegion).queryByLabelText("Search workspaces"),
    ).not.toBeInTheDocument();
    expect(
      within(workspacesRegion).queryByRole("button", { name: "List view" }),
    ).not.toBeInTheDocument();
  });

  it("preserves personal ownership nominations section", async () => {
    renderOrganizationRoute(ROUTES.workspaces);

    const nominationsRegion = await screen.findByRole("region", {
      name: "Your ownership nominations",
    });
    expect(nominationsRegion).toBeVisible();
    expect(
      await within(nominationsRegion).findByRole("button", {
        name: "Accept Owner nomination",
      }),
    ).toBeVisible();
  });
});
