import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import { projectDetail } from "@/features/projects/api/contracts";
import { mockEngagementRepository } from "@/features/engagements/api/mockEngagementRepository";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { projectFixtures } from "@/mocks/projects";
import { organizationIds as ids } from "@/mocks/workspaces";
import {
  workspaceProjectsPath,
  workspaceEngagementPath,
  workspaceProjectPath,
} from "@/lib/routes";
import {
  establishOrganizationSession,
  organizationReadHandlers,
  orgBase,
  failure,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";
import { ProjectLocationProbe } from "@/test/fixtures/ProjectLocationProbe";
import { server } from "@/test/mocks/server";
const path = workspaceProjectsPath(ids.organization);
const originalScroll = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);
beforeEach(() => {
  __resetMocks();
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: () => {},
  });
});
afterEach(() => {
  __resetMocks();
  if (originalScroll)
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      originalScroll,
    );
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});
const renderPage = (query = "") =>
  renderOrganizationRoute(
    `${path}${query}`,
    undefined,
    <ProjectLocationProbe />,
  );
const filters = () =>
  within(screen.getByRole("group", { name: "Project filters" }));
async function openCreate() {
  const user = userEvent.setup();
  await user.click(
    await screen.findByRole(
      "button",
      { name: "Create project" },
      { timeout: 3000 },
    ),
  );
  return {
    user,
    dialog: within(screen.getByRole("dialog", { name: "Create project" })),
  };
}
async function selectOption(control: HTMLElement, option: string) {
  const user = userEvent.setup();
  control.focus();
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("option", { name: option }));
}
async function fillCreate(
  user: ReturnType<typeof userEvent.setup>,
  name = "New delivery project",
) {
  await user.type(screen.getByLabelText("Project name"), name);
  await user.type(
    screen.getByLabelText("Purpose"),
    "Deliver the agreed outcome.",
  );
}
describe("project portfolio outcomes", () => {
  it("loads six cards and renders participation-only articles, labels and explicit open links", async () => {
    renderPage();
    const loading = await screen.findByText("Loading projects.");
    expect(
      loading
        .closest('[role="status"]')
        ?.querySelectorAll('[data-slot="skeleton"]'),
    ).toHaveLength(6);
    const list = within(await screen.findByRole("list", { name: "Projects" }));
    expect(list.getAllByRole("article")).toHaveLength(3);
    expect(
      list.getByRole("heading", { level: 3, name: "Internal design system" }),
    ).toBeVisible();
    expect(list.getByText("PM · BA")).toBeVisible();
    expect(list.getByText("3 setup steps missing")).toBeVisible();
    expect(
      list.getByRole("link", {
        name: "Open project Loyalty platform – Phase 1",
      }),
    ).toHaveAttribute(
      "href",
      workspaceProjectPath(
        ids.organization,
        projectFixtures[0]?.detail.id ?? "",
      ),
    );
    expect(
      screen.getByText(
        "Projects you take part in. Other projects in this workspace are not shown.",
      ),
    ).toBeVisible();
    expect(
      screen.getByText(/Sample data. This page is not connected/),
    ).toBeVisible();
    expect(
      screen.queryByText(
        /On Track|At Risk|Kanban|stories completed|Sprint progress/i,
      ),
    ).not.toBeInTheDocument();
  });
  it("does not list an Owner's non-participating projects", async () => {
    __setMockPersona("u-mai");
    renderPage();
    const list = within(await screen.findByRole("list", { name: "Projects" }));
    expect(list.getAllByRole("article")).toHaveLength(1);
    expect(list.queryByText("Fleet telemetry MVP")).not.toBeInTheDocument();
    expect(list.queryByText("Internal design system")).not.toBeInTheDocument();
  });
  it("shows a genuine empty state and hides creation without a create code", async () => {
    __setMockPersona("u-grace");
    renderPage("?create=1&state=success");
    expect(
      await screen.findByRole("heading", {
        name: "You're not in any project yet",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Projects appear here when you create one or a project admin adds you.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Create project" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText(/Preview state/)).not.toBeInTheDocument();
  });
  it("offers creation from an empty result when allowed", async () => {
    vi.spyOn(getProjectRepository(), "listMine").mockResolvedValue([]);
    renderPage();
    await screen.findByRole("heading", {
      name: "You're not in any project yet",
    });
    await waitFor(
      () => {
        expect(
          screen.getAllByRole("button", { name: "Create project" }),
        ).toHaveLength(2);
      },
      { timeout: 3000 },
    );
    await userEvent
      .setup()
      .click(
        screen.getAllByRole("button", { name: "Create project" })[1] ??
          document.body,
      );
    expect(
      screen.getByRole("dialog", { name: "Create project" }),
    ).toBeVisible();
  });
  it("keeps search/status/kind filters in the URL and supports back and clearing", async () => {
    renderPage();
    await screen.findByRole("list", { name: "Projects" });
    await selectOption(
      filters().getByRole("combobox", { name: "Status" }),
      "Draft",
    );
    expect(filters().getByText("1 project")).toBeVisible();
    expect(screen.getByLabelText("Current search")).toHaveTextContent(
      "status=Draft",
    );
    await selectOption(
      filters().getByRole("combobox", { name: "Kind" }),
      "Internal",
    );
    expect(
      screen.getByRole("heading", { name: "No projects match these filters." }),
    ).toBeVisible();
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Go back" }));
    await waitFor(() =>
      expect(
        filters().getByRole("combobox", { name: "Kind" }),
      ).toHaveTextContent("All"),
    );
    await userEvent
      .setup()
      .type(
        filters().getByRole("textbox", { name: "Search projects" }),
        "unmatched",
      );
    expect(screen.getByLabelText("Current search")).toHaveTextContent(
      "q=unmatched",
    );
    await userEvent
      .setup()
      .click(filters().getByRole("button", { name: "Clear filters" }));
    expect(filters().getByText("3 projects")).toBeVisible();
  });
  it("opens mobile Filters by keyboard, changes a filter and returns focus", async () => {
    renderPage();
    await screen.findByRole("list", { name: "Projects" });
    const user = userEvent.setup(),
      trigger = screen.getByRole("button", { name: "Filters" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const dialog = within(screen.getByRole("dialog", { name: "Filters" }));
    await selectOption(
      dialog.getByRole("combobox", { name: "Kind" }),
      "Internal",
    );
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(trigger).toHaveTextContent("1");
    expect(filters().getByText("1 project")).toBeVisible();
  });
  it("renders error and exact 503 copy, then retries the read", async () => {
    __setMockFailure("projects.listMine", "server");
    renderPage();
    expect(
      await screen.findByText("We couldn't confirm your access right now."),
    ).toBeVisible();
    __setMockFailure("projects.listMine", null);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("list", { name: "Projects" })).toBeVisible();
  });
  it("denies workspace admission before any project repository read", async () => {
    const list = vi.spyOn(getProjectRepository(), "listMine");
    server.use(
      http.get(`${orgBase}/members/me`, () => failure(403, "Forbidden")),
    );
    renderPage();
    await screen.findByRole("heading", { name: "Workspaces" });
    expect(list).not.toHaveBeenCalled();
  });
  it("renders the orphan attention badge for an active member of that project", async () => {
    __setMockPersona("u-arjun");
    renderPage();
    const article = within(
      await screen.findByRole("article", { name: "Warehouse scanner app" }),
    );
    expect(article.getByText("No active administrator")).toBeVisible();
  });
});
describe("project creation", () => {
  it.each(["Client", "Internal"] as const)(
    "creates a %s project and navigates to overview with verified sample feedback",
    async (kind) => {
      const create = vi.spyOn(getProjectRepository(), "create");
      renderPage();
      const { user, dialog } = await openCreate();
      await fillCreate(user);
      if (kind === "Client")
        await selectOption(
          dialog.getByRole("combobox", { name: "Engagement" }),
          "Larkspur Retail Group — Loyalty platform rebuild (LRG-2026-014)",
        );
      else
        await selectOption(
          dialog.getByRole("combobox", { name: "Project type" }),
          "Internal project",
        );
      expect(
        dialog.getByText(
          "Framework: Scrum. Sprint length starts at 2 weeks; you can change it later.",
        ),
      ).toBeVisible();
      expect(
        dialog.queryByRole("combobox", { name: /Framework|Sprint length/ }),
      ).not.toBeInTheDocument();
      await user.click(dialog.getByRole("button", { name: "Create project" }));
      expect(
        await screen.findByText(
          "Project created. You are its project administrator. (sample data — not saved to a server)",
          {},
          { timeout: 3000 },
        ),
      ).toBeVisible();
      expect(screen.getByLabelText("Current search")).toHaveTextContent(
        "?tab=overview",
      );
      expect(create.mock.lastCall?.[1]).toMatchObject({
        kind,
        engagementId:
          kind === "Internal" ? null : "019a3000-0000-7000-8000-000000000001",
      });
      const result: unknown = await create.mock.results[0]?.value;
      const created = projectDetail.parse(result);
      expect(created.status).toBe("Draft");
      expect(created.myRoles).toEqual(["ProjectAdministrator"]);
    },
  );
  it("preselects Client and the engagement when opened from the engagement header link", async () => {
    const engagementId = "019a3000-0000-7000-8000-000000000001";
    renderOrganizationRoute(
      workspaceEngagementPath(ids.organization, engagementId),
      undefined,
      <ProjectLocationProbe />,
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole(
        "link",
        { name: "Create project" },
        { timeout: 3000 },
      ),
    );
    const dialog = within(
      await screen.findByRole(
        "dialog",
        { name: "Create project" },
        { timeout: 3000 },
      ),
    );
    expect(
      dialog.getByRole("combobox", { name: "Project type" }),
    ).toHaveTextContent("Client project");
    expect(
      dialog.getByRole("combobox", { name: "Engagement" }),
    ).toHaveTextContent(
      "Larkspur Retail Group — Loyalty platform rebuild (LRG-2026-014)",
    );
  });
  it("disables Client without engagement visibility and defaults to Internal", async () => {
    vi.spyOn(getProjectRepository(), "creationOptions").mockResolvedValue({
      create: true,
      engagements: [],
    });
    renderPage();
    const { user, dialog } = await openCreate();
    expect(
      dialog.getByRole("combobox", { name: "Project type" }),
    ).toHaveTextContent("Internal project");
    expect(
      dialog.getByText(
        "You need engagement read access to create a client project. Create an internal project or ask an Admin.",
      ),
    ).toBeVisible();
    dialog.getByRole("combobox", { name: "Project type" }).focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("option", { name: "Client project" }),
    ).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{Escape}");
    expect(
      dialog.queryByRole("combobox", { name: "Engagement" }),
    ).not.toBeInTheDocument();
  });
  it("validates required values, length limits and engagement selection on blur/submit", async () => {
    const create = vi.spyOn(getProjectRepository(), "create");
    renderPage();
    const { user, dialog } = await openCreate();
    await user.click(dialog.getByRole("button", { name: "Create project" }));
    expect(await dialog.findByText("Enter a project name.")).toBeVisible();
    expect(dialog.getByText("Describe the project's purpose.")).toBeVisible();
    expect(
      dialog.getByText("Choose the engagement this project delivers.", {
        selector: "p",
      }),
    ).toBeVisible();
    await user.click(dialog.getByLabelText("Project name"));
    await user.paste("N".repeat(161));
    await user.tab();
    expect(
      await dialog.findByText("Use 160 characters or fewer."),
    ).toBeVisible();
    await user.click(dialog.getByLabelText("Purpose"));
    await user.paste("P".repeat(501));
    await user.tab();
    expect(
      await dialog.findByText("Use 500 characters or fewer."),
    ).toBeVisible();
    expect(dialog.getByText("501 / 500")).toBeVisible();
    expect(create).not.toHaveBeenCalled();
  });
  it("reports a Closed engagement at submit and preserves the entered name and purpose", async () => {
    __setMockPersona("u-mai");
    renderPage();
    const { user, dialog } = await openCreate();
    await fillCreate(user);
    await selectOption(
      dialog.getByRole("combobox", { name: "Engagement" }),
      "Larkspur Retail Group — Loyalty platform rebuild (LRG-2026-014)",
    );
    await act(async () => {
      const engagement = await mockEngagementRepository.get(
        ids.organization,
        "019a3000-0000-7000-8000-000000000001",
      );
      await mockEngagementRepository.close(ids.organization, engagement.id, {
        expectedVersion: engagement.version,
        reason: "Complete",
      });
    });
    await user.click(dialog.getByRole("button", { name: "Create project" }));
    expect(
      await dialog.findByText(
        "This engagement is closed. Choose an active engagement.",
        {},
        { timeout: 3000 },
      ),
    ).toBeVisible();
    expect(dialog.getByLabelText("Project name")).toHaveValue(
      "New delivery project",
    );
    expect(dialog.getByLabelText("Purpose")).toHaveValue(
      "Deliver the agreed outcome.",
    );
  });
  it("retains an uncertain idempotent intent across deliberate dialog closure and retry", async () => {
    __setMockFailure("projects.create", "server");
    const create = vi.spyOn(getProjectRepository(), "create");
    renderPage();
    const { user, dialog } = await openCreate();
    await fillCreate(user);
    await selectOption(
      dialog.getByRole("combobox", { name: "Project type" }),
      "Internal project",
    );
    await user.click(dialog.getByRole("button", { name: "Create project" }));
    await dialog.findByText(/The outcome is unknown/);
    expect(dialog.getByLabelText("Project name")).toHaveAttribute("readonly");
    await user.click(dialog.getByRole("button", { name: "Cancel" }));
    const discard = screen.queryByRole("button", { name: "Discard changes" });
    if (discard) await user.click(discard);
    await user.click(screen.getByRole("button", { name: "Create project" }));
    expect(screen.getByLabelText("Project name")).toHaveValue(
      "New delivery project",
    );
    __setMockFailure("projects.create", null);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create project",
      }),
    );
    await screen.findByText(
      /Project created. You are its project administrator./,
      {},
      { timeout: 3000 },
    );
    expect(create.mock.calls[0]?.[2]).toBe(create.mock.calls[1]?.[2]);
    expect(create.mock.calls[0]?.[1]).toEqual(create.mock.calls[1]?.[1]);
  });
});
