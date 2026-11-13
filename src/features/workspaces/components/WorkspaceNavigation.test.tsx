import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http } from "msw";
import { describe, expect, it } from "vitest";
import {
  myMembershipOptions,
  rolesOptions,
} from "@/features/workspaces/api/queries";
import {
  workspaceOverviewPath,
  workspaceProjectPath,
  workspaceEngagementPath,
  workspaceProjectsPath,
} from "@/lib/routes";
import { workspaceSectionSearch } from "@/lib/workspaceSections";
import {
  organizationIds as ids,
  organizationFixtures as f,
  workspaceNavigationFixtures as profiles,
} from "@/mocks/workspaces";
import {
  establishOrganizationSession,
  organizationReadHandlers,
  orgBase,
  success,
  paged,
  failure,
} from "@/test/fixtures/organizationApi";
import { server } from "@/test/mocks/server";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";

function setup(
  profile: keyof typeof profiles,
  path = workspaceOverviewPath(ids.organization),
) {
  const owner = establishOrganizationSession();
  server.use(...organizationReadHandlers);
  server.use(
    http.get(`${orgBase}/members/me`, () => success(profiles[profile].member)),
    http.get(`${orgBase}/roles`, () => success(paged(profiles[profile].roles))),
  );
  return {
    ...renderOrganizationRoute(path),
    scope: { ...owner, workspaceId: ids.organization },
  };
}
const sidebar = () =>
  within(screen.getByRole("complementary", { name: "Workspace sidebar" }));
const findSidebarLink = (name: string) =>
  waitFor(() => sidebar().getByRole("link", { name }));
async function tabTo(
  user: ReturnType<typeof userEvent.setup>,
  target: HTMLElement,
) {
  for (let count = 0; count < 40 && document.activeElement !== target; count++)
    await user.tab();
  expect(target).toHaveFocus();
}

describe("workspace navigation from current API reads", () => {
  it.each([
    ["owner", true, true, true],
    ["admin", true, true, false],
    ["member", false, false, false],
    ["reader", true, false, false],
  ] as const)(
    "shows the permitted navigation and quick links for %s",
    async (profile, engagements, links, recovery) => {
      const { client, scope } = setup(profile);
      await screen.findByRole("heading", { name: f.workspace.name });
      await waitFor(() => {
        expect(client.getQueryState(rolesOptions(scope).queryKey)?.status).toBe(
          "success",
        );
      });
      await waitFor(() => {
        expect(
          Boolean(sidebar().queryByRole("link", { name: "Engagements" })),
        ).toBe(engagements);
        expect(
          Boolean(screen.queryByRole("link", { name: "View engagements" })),
        ).toBe(engagements);
      });
      expect(
        Boolean(sidebar().queryByRole("link", { name: "Client links" })),
      ).toBe(links);
      expect(
        Boolean(sidebar().queryByRole("link", { name: "Project recovery" })),
      ).toBe(recovery);
      expect(
        Boolean(screen.queryByRole("tab", { name: "Project recovery" })),
      ).toBe(recovery);
      expect(
        screen.getByRole("link", { name: "View projects" }),
      ).toHaveAttribute("href", workspaceProjectsPath(ids.organization));
      expect(
        sidebar().getByRole("navigation", { name: "Delivery" }),
      ).toBeVisible();
      expect(sidebar().getByRole("link", { name: "Overview" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    },
  );

  it("hides restricted links while membership is unknown", async () => {
    setup("owner");
    server.use(
      http.get(`${orgBase}/members/me`, async () => {
        await delay(80);
        return success(profiles.owner.member);
      }),
    );
    expect(
      sidebar().queryByRole("link", { name: "Client links" }),
    ).not.toBeInTheDocument();
    expect(
      sidebar().queryByRole("link", { name: "Project recovery" }),
    ).not.toBeInTheDocument();
    expect(
      sidebar().queryByRole("link", { name: "Engagements" }),
    ).not.toBeInTheDocument();
    await screen.findByRole("heading", { name: f.workspace.name });
  });

  it("withholds engagement links while the role catalog loads", async () => {
    const { client, scope } = setup("reader");
    server.use(
      http.get(`${orgBase}/roles`, async () => {
        await delay(120);
        return success(paged(profiles.reader.roles));
      }),
    );
    await screen.findByRole("heading", { name: f.workspace.name });
    expect(
      sidebar().queryByRole("link", { name: "Engagements" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View engagements" }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(client.getQueryState(rolesOptions(scope).queryKey)?.status).toBe(
        "success",
      );
    });
    expect(await findSidebarLink("Engagements")).toBeVisible();
  });

  it.each([403, 503])(
    "fails closed on role catalog status %s",
    async (status) => {
      const { client, scope } = setup("reader");
      server.use(
        http.get(`${orgBase}/roles`, () =>
          failure(status, "Organization.ReadUnavailable"),
        ),
      );
      await screen.findByRole("heading", { name: f.workspace.name });
      await waitFor(() => {
        expect(client.getQueryState(rolesOptions(scope).queryKey)?.status).toBe(
          "error",
        );
      });
      expect(
        sidebar().queryByRole("link", { name: "Engagements" }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("link", { name: "View engagements" }),
      ).not.toBeInTheDocument();
      expect(sidebar().getByRole("link", { name: "Projects" })).toBeVisible();
    },
  );

  it("does not treat unassigned catalog roles as caller permissions", async () => {
    const { client, scope } = setup("member");
    server.use(
      http.get(`${orgBase}/roles`, () => success(paged(profiles.reader.roles))),
    );
    await screen.findByRole("heading", { name: f.workspace.name });
    await waitFor(() => {
      expect(client.getQueryState(rolesOptions(scope).queryKey)?.status).toBe(
        "success",
      );
    });
    expect(
      sidebar().queryByRole("link", { name: "Engagements" }),
    ).not.toBeInTheDocument();
  });

  it("finds assigned permission codes beyond the first catalog page", async () => {
    setup("reader");
    server.use(
      http.get(`${orgBase}/roles`, ({ request }) =>
        success(
          new URL(request.url).searchParams.has("cursor")
            ? paged(profiles.reader.roles)
            : paged(profiles.member.roles, "next"),
        ),
      ),
    );
    expect(await findSidebarLink("Engagements")).toBeVisible();
    expect(
      await screen.findByRole("link", { name: "View engagements" }),
    ).toBeVisible();
  });

  it("hides engagement links for an empty catalog", async () => {
    const { client, scope } = setup("reader");
    server.use(http.get(`${orgBase}/roles`, () => success(paged([]))));
    await screen.findByRole("heading", { name: f.workspace.name });
    await waitFor(() => {
      expect(client.getQueryState(rolesOptions(scope).queryKey)?.status).toBe(
        "success",
      );
    });
    expect(
      sidebar().queryByRole("link", { name: "Engagements" }),
    ).not.toBeInTheDocument();
  });

  it("removes restricted links after a confirmed membership change", async () => {
    const { client, scope } = setup("owner");
    await findSidebarLink("Project recovery");
    server.use(
      http.get(`${orgBase}/members/me`, () => success(profiles.member.member)),
    );
    await act(() =>
      client.invalidateQueries({
        queryKey: myMembershipOptions(scope).queryKey,
      }),
    );
    await waitFor(() =>
      expect(
        sidebar().queryByRole("link", { name: "Project recovery" }),
      ).not.toBeInTheDocument(),
    );
    expect(
      sidebar().queryByRole("link", { name: "Client links" }),
    ).not.toBeInTheDocument();
    expect(
      sidebar().queryByRole("link", { name: "Engagements" }),
    ).not.toBeInTheDocument();
  });

  it.each([
    [workspaceProjectPath(ids.organization, ids.role), "Projects"],
    [workspaceEngagementPath(ids.organization, ids.role), "Engagements"],
  ])(
    "keeps workspace navigation active on nested path %s",
    async (path, title) => {
      setup("reader", path);
      expect(await findSidebarLink(title)).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(
        sidebar().getByRole("link", { name: "Overview" }),
      ).not.toHaveAttribute("aria-current");
    },
  );

  it("makes the new Sheet items keyboard reachable and closes after navigation", async () => {
    setup("owner");
    await findSidebarLink("Engagements");
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const sheet = within(screen.getByRole("dialog", { name: "Navigation" }));
    for (const name of [
      "Projects",
      "Engagements",
      "Client links",
      "Project recovery",
    ]) {
      await tabTo(user, sheet.getByRole("link", { name }));
    }
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard("{Enter}");
    await tabTo(
      user,
      within(screen.getByRole("dialog", { name: "Navigation" })).getByRole(
        "link",
        { name: "Projects" },
      ),
    );
    await user.keyboard("{Enter}");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Projects" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "Navigation" }),
    ).not.toBeInTheDocument();
  });

  it("keeps recovery hidden for non-Owners even on a direct section address", async () => {
    setup(
      "admin",
      `${workspaceOverviewPath(ids.organization)}${workspaceSectionSearch("projects-recovery")}`,
    );
    expect(
      await screen.findByText("Only workspace Owners can recover projects."),
    ).toBeVisible();
    expect(
      screen.queryByRole("tab", { name: "Project recovery" }),
    ).not.toBeInTheDocument();
    expect(
      sidebar().queryByRole("link", { name: "Project recovery" }),
    ).not.toBeInTheDocument();
  });
});
