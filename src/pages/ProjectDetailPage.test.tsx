import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import { projectKey, projectsKey } from "@/features/projects/api/queries";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import {
  firstProject,
  draftProject,
  internalProject,
  projectPerson,
} from "@/test/fixtures/projectMock";
import { organizationIds as ids } from "@/mocks/workspaces";
import {
  workspaceProjectPath,
  workspaceProjectsPath,
  workspaceEngagementPath,
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
const id = firstProject.detail.id,
  wid = ids.organization;
const originalScroll = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: () => {},
  });
  __resetMocks();
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
});
afterEach(() => {
  if (originalScroll)
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      originalScroll,
    );
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  __resetMocks();
});
function renderPage(projectId = id, search = "") {
  return renderOrganizationRoute(
    workspaceProjectPath(wid, projectId) + search,
    undefined,
    <ProjectLocationProbe />,
  );
}
async function ready() {
  await screen.findByRole("heading", { name: "Brief" }, { timeout: 4000 });
}
const region = (name: string) => within(screen.getByRole("region", { name }));
async function openEditor(name = "Problem") {
  await ready();
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: `Edit ${name}` }));
  return {
    user,
    dialog: within(screen.getByRole("dialog", { name: `Edit ${name}` })),
  };
}
describe("project overview reads and routing", () => {
  it("loads a header and six cards, then the approved header, brief, summary and facts", async () => {
    renderPage();
    const loading = await screen.findByText("Loading project overview.");
    expect(
      loading
        .closest('[role="status"]')
        ?.querySelectorAll('[data-slot="card"]'),
    ).toHaveLength(6);
    await ready();
    expect(
      screen.getByRole("heading", { level: 1, name: firstProject.detail.name }),
    ).toBeVisible();
    expect(screen.getByText(firstProject.detail.purpose)).toBeVisible();
    expect(
      within(screen.getByRole("group", { name: "Your roles" })).getByText("PM"),
    ).toBeVisible();
    expect(
      within(screen.getByRole("group", { name: "Your roles" })).getByText("BA"),
    ).toBeVisible();
    expect(
      screen.getByRole("tablist", { name: "Project sections" }),
    ).toBeVisible();
    expect(screen.getByText("5 of 6 written")).toBeVisible();
    expect(region("Open questions").getByText("Not yet written")).toBeVisible();
    expect(
      region("Open questions").getByRole("button", {
        name: "Add Open questions",
      }),
    ).toBeVisible();
    expect(region("Facts").getByText("Scrum")).toBeVisible();
    expect(
      region("Engagement summary").getByRole("link", {
        name: "Loyalty platform rebuild",
      }),
    ).toHaveAttribute(
      "href",
      workspaceEngagementPath(wid, firstProject.detail.engagement?.id ?? ""),
    );
    expect(
      screen.getByText(/Sample data. This page is not connected/),
    ).toBeVisible();
  });
  it("counts only the six brief items, including whitespace as missing", async () => {
    vi.spyOn(getProjectRepository(), "getBrief").mockResolvedValue({
      ...firstProject.brief,
      assumptions: " \n ",
      openQuestions: null,
    });
    renderPage();
    await ready();
    expect(screen.getByText("4 of 6 written")).toBeVisible();
    expect(region("Assumptions").getByText("Not yet written")).toBeVisible();
  });
  it.each(["u-arjun", "u-hannah", "viewer", "devops"] as const)(
    "hides all editing controls for %s",
    async (role) => {
      if (role === "viewer") renderPage(internalProject.detail.id);
      else if (role === "devops") {
        const read = getProjectRepository().get.bind(getProjectRepository());
        vi.spyOn(getProjectRepository(), "get").mockImplementation(
          async (...args) => {
            const row = await read(...args);
            return {
              ...row,
              myRoles: ["DevOps"],
              permissions: {
                ...row.permissions,
                editBrief: false,
                share: false,
              },
            };
          },
        );
        renderPage();
      } else {
        __setMockPersona(role);
        renderPage();
      }
      await ready();
      expect(
        screen.queryByRole("button", { name: /^(Edit|Add) / }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("tab", { name: "Sharing" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("tab", { name: "Settings" })).toBeVisible();
    },
  );
  it.each(["u-mai", "u-linh", "u-sofia"] as const)(
    "offers brief editing to the server-granted editor %s",
    async (persona) => {
      __setMockPersona(persona);
      renderPage();
      await ready();
      expect(
        screen.getByRole("button", { name: "Edit Problem" }),
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: "Edit Product Goal" }),
      ).toBeVisible();
    },
  );
  it("shows a Draft administrator's computed setup gaps and focuses activation from the overview callout", async () => {
    renderPage(draftProject.detail.id);
    await ready();
    expect(screen.getByText("3 setup steps missing")).toBeVisible();
    expect(screen.getByRole("link", { name: "Review setup" })).toHaveAttribute(
      "href",
      `${workspaceProjectPath(wid, draftProject.detail.id, "settings")}#activation`,
    );
    await userEvent
      .setup()
      .click(screen.getByRole("link", { name: "Review setup" }));
    expect(screen.getByRole("tab", { name: "Settings" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    const activation = await screen.findByRole("region", {
      name: "Activation",
    });
    expect(activation).toHaveAttribute("id", "activation");
    await waitFor(() => {
      expect(activation).toHaveFocus();
    });
  });
  it("exposes earlier Product Goals by keyboard to a read-only participant with date and author", async () => {
    __setMockPersona("u-arjun");
    renderPage();
    await ready();
    const user = userEvent.setup();
    const toggle = screen.getByRole("button", {
      name: "Earlier Product Goals (1)",
    });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText("Launch a member app that shows points."),
    ).toBeVisible();
    expect(screen.getByText(/by Linh Pham/)).toBeVisible();
    await user.keyboard("{Enter}");
    expect(
      screen.queryByText("Launch a member app that shows points."),
    ).not.toBeInTheDocument();
  });
  it("keeps the summary money-free and removes the engagement link for summary-tier readers", async () => {
    __setMockPersona("u-sofia");
    const { client } = renderPage();
    await ready();
    const summary = region("Engagement summary");
    expect(summary.getByText("Larkspur Retail Group")).toBeVisible();
    expect(summary.getByText("LRG-2026-014")).toBeVisible();
    expect(summary.getByText("Member app beta")).toBeVisible();
    expect(summary.getByText("12 Jan 2027")).toBeVisible();
    expect(summary.queryByRole("link")).not.toBeInTheDocument();
    expect(
      summary.queryByText(
        /185,000|AUD|420|person-days|contract value|effort|contacts|Priya Raman|tomasz.nowak@/i,
      ),
    ).not.toBeInTheDocument();
    const data: unknown = client.getQueryData([
      ...projectKey({ accountId: ids.user, workspaceId: wid }, id),
      "overview-context",
    ]);
    expect(JSON.stringify(data)).not.toMatch(
      /contractAmount|plannedEffort|contactRole|primaryEmail/,
    );
  });
  it("replaces URL tabs, preserves unrelated params, and never renders a denied Sharing tab", async () => {
    __setMockPersona("u-sofia");
    renderPage(id, "?tab=sharing&keep=1");
    await ready();
    expect(
      screen.queryByRole("tab", { name: "Sharing" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Current search")).toHaveTextContent("keep=1");
    expect(screen.getByLabelText("Current search")).not.toHaveTextContent(
      "sharing",
    );
    const user = userEvent.setup();
    screen.getByRole("tab", { name: "Overview" }).focus();
    await user.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(screen.getByRole("tab", { name: "Team" })).toHaveAttribute(
        "aria-selected",
        "true",
      ),
    );
    expect(screen.getByLabelText("Current search")).toHaveTextContent(
      "tab=team",
    );
    expect(
      await screen.findByRole("table", { name: "Project team" }),
    ).toBeVisible();
  });
  it.each(["missing", "owner", "guest", "forbidden"])(
    "masks %s resource access and never loads overview data",
    async (outcome) => {
      const brief = vi.spyOn(getProjectRepository(), "getBrief");
      if (outcome === "owner") __setMockPersona("u-mai");
      if (outcome === "guest") __setMockPersona("u-tomasz");
      if (outcome === "forbidden")
        __setMockFailure("projects.get", "forbidden");
      renderPage(
        outcome === "missing"
          ? crypto.randomUUID()
          : outcome === "owner"
            ? internalProject.detail.id
            : id,
      );
      expect(
        await screen.findByText(
          "This project isn't available. It may not exist, or you may not have access.",
          {},
          { timeout: 3000 },
        ),
      ).toBeVisible();
      expect(
        screen.getByRole("link", { name: "Back to projects" }),
      ).toHaveAttribute("href", workspaceProjectsPath(wid));
      expect(brief).not.toHaveBeenCalled();
    },
  );
  it("handles errors with retry and ignores preview-state overrides", async () => {
    __setMockFailure("projects.getBrief", "server");
    renderPage(id, "?state=success");
    expect(
      await screen.findByText("Could not load project", {}, { timeout: 3000 }),
    ).toBeVisible();
    expect(screen.queryByText(/Preview state/)).not.toBeInTheDocument();
    __setMockFailure("projects.getBrief", null);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled(),
    );
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "Try again" }));
    await ready();
  });
  it("requires real workspace admission before the project read", async () => {
    const get = vi.spyOn(getProjectRepository(), "get");
    server.use(
      http.get(`${orgBase}/members/me`, () => failure(403, "Forbidden")),
    );
    renderPage();
    await screen.findByRole("heading", { name: "Workspaces" });
    expect(get).not.toHaveBeenCalled();
  });
});
describe("versioned brief edits", () => {
  it("saves a brief item, sends the loaded version and announces verified sample success", async () => {
    const write = vi.spyOn(getProjectRepository(), "updateBriefItem");
    renderPage();
    const { user, dialog } = await openEditor();
    await user.clear(dialog.getByLabelText("Problem"));
    await user.type(
      dialog.getByLabelText("Problem"),
      "A revised problem\nWith another line.",
    );
    await user.click(dialog.getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText(
        "Brief updated. (sample data — not saved to a server)",
        {},
        { timeout: 3000 },
      ),
    ).toBeVisible();
    expect(write.mock.lastCall?.[2]).toMatchObject({
      item: "Problem",
      expectedVersion: firstProject.brief.version,
      value: "A revised problem\nWith another line.",
    });
    expect(region("Problem").getByText(/A revised problem/)).toHaveClass(
      "whitespace-pre-line",
    );
  });
  it("updates Product Goal and preserves the previous value for every reader", async () => {
    renderPage();
    const { user, dialog } = await openEditor("Product Goal");
    await user.clear(dialog.getByLabelText("Product Goal"));
    await user.type(
      dialog.getByLabelText("Product Goal"),
      "A new Product Goal",
    );
    await user.click(dialog.getByRole("button", { name: "Save" }));
    await screen.findByText(
      "Product Goal updated. (sample data — not saved to a server)",
      {},
      { timeout: 3000 },
    );
    await user.click(
      screen.getByRole("button", { name: "Earlier Product Goals (2)" }),
    );
    expect(
      screen.getByText(firstProject.brief.productGoal ?? ""),
    ).toBeVisible();
  });
  it("validates 4,000 characters on blur, accepts empty content, and updates the missing count", async () => {
    const write = vi.spyOn(getProjectRepository(), "updateBriefItem");
    renderPage();
    const { user, dialog } = await openEditor();
    await user.clear(dialog.getByLabelText("Problem"));
    await user.paste("X".repeat(4001));
    await user.tab();
    expect(
      await dialog.findByText("Use 4,000 characters or fewer."),
    ).toBeVisible();
    expect(dialog.getByText("4,001 / 4,000")).toBeVisible();
    expect(dialog.getByLabelText("Problem")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(write).not.toHaveBeenCalled();
    await user.clear(dialog.getByLabelText("Problem"));
    await user.click(dialog.getByRole("button", { name: "Save" }));
    await screen.findByText(
      "Brief updated. (sample data — not saved to a server)",
      {},
      { timeout: 3000 },
    );
    expect(region("Problem").getByText("Not yet written")).toBeVisible();
    expect(screen.getByText("4 of 6 written")).toBeVisible();
    expect(write.mock.lastCall?.[2].value).toBeNull();
  });
  it("keeps local input after a 409 and reloads server values without closing", async () => {
    const repo = getProjectRepository();
    renderPage();
    const { user, dialog } = await openEditor();
    await user.clear(dialog.getByLabelText("Problem"));
    await user.type(dialog.getByLabelText("Problem"), "Local work");
    await act(async () => {
      await repo.updateBriefItem(wid, id, {
        expectedVersion: firstProject.brief.version,
        item: "Problem",
        value: "Server version",
      });
    });
    await user.click(dialog.getByRole("button", { name: "Save" }));
    expect(
      await dialog.findByText(
        "Someone else changed this. Reload to see the latest version.",
      ),
    ).toBeVisible();
    expect(dialog.getByLabelText("Problem")).toHaveValue("Local work");
    await user.click(dialog.getByRole("button", { name: "Reload" }));
    await waitFor(() =>
      expect(dialog.getByLabelText("Problem")).toHaveValue("Server version"),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.clear(dialog.getByLabelText("Problem"));
    await user.type(dialog.getByLabelText("Problem"), "Reviewed work");
    await user.click(dialog.getByRole("button", { name: "Save" }));
    await screen.findByText(
      "Brief updated. (sample data — not saved to a server)",
      {},
      { timeout: 3000 },
    );
  });
  it("keeps a failed write open with its input and offers no fake success", async () => {
    __setMockFailure("projects.updateBriefItem", "server");
    renderPage();
    const { user, dialog } = await openEditor();
    await user.clear(dialog.getByLabelText("Problem"));
    await user.type(dialog.getByLabelText("Problem"), "Unsaved draft");
    await user.click(dialog.getByRole("button", { name: "Save" }));
    expect(await dialog.findByText(/The outcome is unknown/)).toBeVisible();
    expect(dialog.getByLabelText("Problem")).toHaveValue("Unsaved draft");
    expect(
      screen.queryByText(/Brief updated. \(sample/),
    ).not.toBeInTheDocument();
  });
  it("returns focus on cancellation and confirms a dirty close", async () => {
    renderPage();
    const { user, dialog } = await openEditor();
    await user.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Edit Problem" }),
      ).toHaveFocus(),
    );
    await user.keyboard("{Enter}");
    await user.type(
      within(screen.getByRole("dialog")).getByLabelText("Problem"),
      "Draft",
    );
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("button", { name: "Discard changes" }),
    ).toBeVisible();
  });
  it("hides the page and clears protected cache data on the next action after removal", async () => {
    const repo = getProjectRepository(),
      { client } = renderPage();
    const { user, dialog } = await openEditor();
    await act(async () => {
      client.setQueryData(
        [...projectsKey({ accountId: ids.user, workspaceId: wid }), "mine"],
        await repo.listMine(wid),
      );
    });
    await act(async () => {
      __setMockPersona("u-mai");
      const team = await repo.listParticipants(wid, id),
        me = team.find((item) => item.userId === projectPerson("u-linh").id);
      if (!me) throw new Error("Missing participant");
      await repo.endParticipation(wid, id, me.id, {
        expectedVersion: me.version,
        reason: null,
      });
      __setMockPersona("u-linh");
    });
    await user.click(dialog.getByRole("button", { name: "Save" }));
    await screen.findByText(
      "This project isn't available. It may not exist, or you may not have access.",
      {},
      { timeout: 3000 },
    );
    expect(
      screen.queryByRole("heading", { name: firstProject.detail.name }),
    ).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        client.getQueryData([
          ...projectKey({ accountId: ids.user, workspaceId: wid }, id),
          "brief",
        ]),
      ).toBeUndefined();
    });
    await user.click(screen.getByRole("link", { name: "Back to projects" }));
    const projects = within(
      await screen.findByRole("list", { name: "Projects" }, { timeout: 3000 }),
    );
    expect(
      projects.queryByRole("heading", { name: firstProject.detail.name }),
    ).not.toBeInTheDocument();
  });
});
