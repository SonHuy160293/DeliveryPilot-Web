import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import { ProjectActivationError } from "@/features/projects/api/queries";
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
import { prepareDraft } from "@/test/fixtures/projectSettings";
import { organizationIds as ids } from "@/mocks/workspaces";
import { workspaceProjectPath } from "@/lib/routes";
import {
  establishOrganizationSession,
  organizationReadHandlers,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";
import { server } from "@/test/mocks/server";
import { READINESS_LABELS } from "@/features/projects/settings/readinessItems";
const wid = ids.organization,
  id = firstProject.detail.id,
  draftId = draftProject.detail.id;
const sample = (value: string) =>
  `${value} (sample data — not saved to a server)`;
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
  vi.restoreAllMocks();
  if (originalScroll)
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      originalScroll,
    );
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});
function renderPage(projectId = id) {
  return renderOrganizationRoute(
    workspaceProjectPath(wid, projectId, "settings"),
  );
}
const region = (name: string) => within(screen.getByRole("region", { name }));
async function ready() {
  await screen.findByRole("region", { name: "Activation" }, { timeout: 4000 });
}
async function select(
  user: ReturnType<typeof userEvent.setup>,
  label: string,
  option: string | RegExp,
) {
  screen.getByRole("combobox", { name: label }).focus();
  await user.keyboard("{Enter}");
  await user.click(screen.getByRole("option", { name: option }));
}
describe("project settings reads and permissions", () => {
  it.each([
    "u-mai",
    "u-linh",
    "u-sofia",
    "u-arjun",
    "u-hannah",
    "DevOps",
    "Viewer",
  ] as const)(
    "shows only server-permitted controls for %s",
    async (persona) => {
      let projectId = id;
      if (persona === "DevOps") {
        __setMockPersona("u-mai");
        const repo = getProjectRepository(),
          target = (await repo.listParticipants(wid, id)).find(
            (row) => row.userId === projectPerson("u-arjun").id,
          );
        if (!target) throw new Error("Missing participant");
        await repo.changeRoles(wid, id, target.id, {
          roles: ["DevOps"],
          expectedVersion: target.version,
        });
        __setMockPersona("u-arjun");
      } else if (persona === "Viewer") projectId = internalProject.detail.id;
      else __setMockPersona(persona);
      const history = vi.spyOn(getProjectRepository(), "history");
      renderPage(projectId);
      await ready();
      const manages = persona === "u-mai" || persona === "u-linh";
      expect(
        region("Cadence").queryByRole("combobox", { name: "Sprint length" }) !==
          null,
      ).toBe(manages);
      expect(screen.queryByRole("region", { name: "History" }) !== null).toBe(
        manages,
      );
      if (!manages) expect(history).not.toHaveBeenCalled();
      expect(
        region("Engagement").queryByRole("button"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("combobox", { name: "Framework" }),
      ).not.toBeInTheDocument();
      expect(screen.getByText(/^Sample data\./)).toBeVisible();
    },
  );
  it("loads activation independently, retries a repository failure and lists every checklist item", async () => {
    __setMockFailure("projects.getBrief", "server");
    renderPage(draftId);
    expect(
      await screen.findByText("Loading activation", {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    const retry = await screen.findByRole("button", {
      name: "Retry loading activation",
    });
    expect(region("Cadence").getByText("Scrum")).toBeVisible();
    __setMockFailure("projects.getBrief", null);
    await userEvent.click(retry);
    await ready();
    for (const label of Object.values(READINESS_LABELS))
      expect(region("Activation").getByText(label)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Activate project" }),
    ).toBeDisabled();
    expect(
      screen.getByText("Complete every required setup step before activating."),
    ).toBeVisible();
    expect(
      region("Activation").getByRole("link", { name: "Go to Team" }),
    ).toHaveAttribute("href", workspaceProjectPath(wid, draftId, "team"));
  });
  it("shows the empty project history from an empty repository outcome", async () => {
    vi.spyOn(getProjectRepository(), "history").mockResolvedValue({
      items: [],
      nextCursor: null,
    });
    renderPage();
    await ready();
    expect(await screen.findByText("No changes recorded yet.")).toBeVisible();
  });
  it("retries a history error and loads the next cursor without replacing earlier events", async () => {
    const repo = getProjectRepository(),
      events = (await repo.history(wid, id, {})).items,
      first = events[0],
      second = events[1];
    if (!first || !second) throw new Error("Missing history fixture");
    const history = vi.spyOn(repo, "history");
    history
      .mockRejectedValueOnce(new Error("Unavailable"))
      .mockResolvedValueOnce({ items: [first], nextCursor: "next" })
      .mockResolvedValueOnce({ items: [second], nextCursor: null });
    renderPage();
    await ready();
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", {
        name: "Retry loading project history",
      }),
    );
    expect(
      await screen.findByRole("table", { name: "Project history" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Load more" }));
    await waitFor(() => {
      expect(
        within(
          screen.getByRole("table", { name: "Project history" }),
        ).getByText(second.summary),
      ).toBeVisible();
    });
    expect(
      within(screen.getByRole("table", { name: "Project history" })).getByText(
        first.summary,
      ),
    ).toBeVisible();
    expect(history).toHaveBeenLastCalledWith(
      wid,
      id,
      { cursor: "next" },
      expect.any(AbortSignal),
    );
  });
});
describe("cadence and engagement changes", () => {
  it("changes to an Active Client engagement and reports the repository's summary-withdrawal outcome", async () => {
    const repo = getProjectRepository();
    await repo.addParticipant(wid, draftId, {
      userId: projectPerson("u-mai").id,
      roles: ["ProjectAdministrator"],
    });
    __setMockPersona("u-mai");
    const change = repo.changeEngagement.bind(repo);
    vi.spyOn(repo, "changeEngagement").mockImplementation(async (...args) => ({
      ...(await change(...args)),
      engagementSummaryWithdrawn: true,
    }));
    renderPage(draftId);
    await ready();
    const user = userEvent.setup();
    await user.click(
      region("Engagement").getByRole("button", { name: "Change" }),
    );
    const form = within(
      screen.getByRole("dialog", { name: "Change engagement" }),
    );
    await waitFor(
      () => {
        expect(
          form.getByRole("combobox", { name: "Engagement" }),
        ).toBeEnabled();
      },
      { timeout: 3000 },
    );
    await select(user, "Engagement", /Larkspur Retail Group/);
    await user.type(
      form.getByLabelText("Reason"),
      "Move to the active agreement.",
    );
    await user.click(form.getByRole("button", { name: "Change engagement" }));
    expect(
      await screen.findByText(
        sample(
          "Engagement changed. The engagement summary is no longer shared with guests.",
        ),
        {},
        { timeout: 4000 },
      ),
    ).toBeVisible();
    expect(
      region("Engagement").getByText(/Larkspur Retail Group/),
    ).toBeVisible();
  }, 10000);
  it("handles a failed cadence save and a confirmed sample success", async () => {
    renderPage();
    await ready();
    const user = userEvent.setup();
    await select(user, "Sprint length", "3 weeks");
    __setMockFailure("projects.setSprintLength", "server");
    await user.click(region("Cadence").getByRole("button", { name: "Save" }));
    expect(await region("Cadence").findByRole("alert")).toHaveTextContent(
      /outcome is unknown/,
    );
    __setMockFailure("projects.setSprintLength", null);
    await user.click(region("Cadence").getByRole("button", { name: "Save" }));
    expect(
      await screen.findByText(sample("Sprint length set to 3 weeks.")),
    ).toBeVisible();
    expect(
      screen.getByRole("combobox", { name: "Sprint length" }),
    ).toHaveTextContent("3 weeks");
  });
  it("retains a stale cadence selection until an explicit conflict reload", async () => {
    renderPage();
    await ready();
    const user = userEvent.setup();
    await select(user, "Sprint length", "3 weeks");
    await act(async () => {
      await getProjectRepository().setSprintLength(
        wid,
        id,
        4,
        firstProject.detail.version,
      );
    });
    await user.click(region("Cadence").getByRole("button", { name: "Save" }));
    expect(await region("Cadence").findByRole("alert")).toHaveTextContent(
      "Someone else changed this. Reload to see the latest version.",
    );
    expect(
      screen.getByRole("combobox", { name: "Sprint length" }),
    ).toHaveTextContent("3 weeks");
    await user.click(region("Cadence").getByRole("button", { name: "Reload" }));
    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Sprint length" }),
      ).toHaveTextContent("4 weeks");
    });
  });
  it("hides engagement change for a Draft PA without the engagement manage code", async () => {
    renderPage(draftId);
    await ready();
    expect(
      region("Engagement").queryByRole("button", { name: "Change" }),
    ).not.toBeInTheDocument();
  });
  it("changes a Draft engagement to Internal with a required reason, then removes its engagement", async () => {
    const repo = getProjectRepository();
    await repo.addParticipant(wid, draftId, {
      userId: projectPerson("u-mai").id,
      roles: ["ProjectAdministrator"],
    });
    __setMockPersona("u-mai");
    renderPage(draftId);
    await ready();
    const user = userEvent.setup();
    await user.click(
      region("Engagement").getByRole("button", { name: "Change" }),
    );
    const form = within(
      screen.getByRole("dialog", { name: "Change engagement" }),
    );
    await select(user, "Kind", "Internal");
    await waitFor(() => {
      expect(
        form.getByRole("button", { name: "Change engagement" }),
      ).toBeEnabled();
    });
    await user.click(form.getByRole("button", { name: "Change engagement" }));
    expect(await form.findByText("Enter a reason.")).toBeVisible();
    await user.type(
      form.getByLabelText("Reason"),
      "Reclassify as internal research.",
    );
    __setMockFailure("projects.changeEngagement", "server");
    await user.click(form.getByRole("button", { name: "Change engagement" }));
    expect(await form.findByRole("alert")).toHaveTextContent(
      /outcome is unknown/,
    );
    __setMockFailure("projects.changeEngagement", null);
    await user.click(form.getByRole("button", { name: "Change engagement" }));
    expect(
      await screen.findByText(
        sample("Engagement changed."),
        {},
        { timeout: 4000 },
      ),
    ).toBeVisible();
    expect(region("Engagement").getByText("Internal project")).toBeVisible();
    expect(
      region("Engagement").queryByText(/HL-SOW-07/),
    ).not.toBeInTheDocument();
    expect((await repo.get(wid, draftId)).engagement).toBeNull();
  }, 10000);
});
describe("activation", () => {
  it("reloads an activation conflict and requires reviewing a fresh waiver", async () => {
    await prepareDraft(wid);
    renderPage(draftId);
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Activate project" }));
    const form = within(
      screen.getByRole("dialog", { name: "Activate project" }),
    );
    await user.type(
      form.getByLabelText(
        "Reason for activating without a client Product Owner",
      ),
      "Initial exception.",
    );
    const repo = getProjectRepository(),
      project = await repo.get(wid, draftId);
    await act(async () => {
      await repo.setSprintLength(wid, draftId, 3, project.version);
    });
    await user.click(form.getByRole("button", { name: "Activate project" }));
    expect(await form.findByRole("alert")).toHaveTextContent(
      "Someone else changed this. Reload to see the latest version.",
    );
    await user.click(form.getByRole("button", { name: "Reload" }));
    await waitFor(() => {
      expect(
        form.getByLabelText(
          "Reason for activating without a client Product Owner",
        ),
      ).toHaveValue("");
    });
    expect(
      form.getByRole("button", { name: "Activate project" }),
    ).toBeDisabled();
    await user.type(
      form.getByLabelText(
        "Reason for activating without a client Product Owner",
      ),
      "Reviewed exception after cadence change.",
    );
    await user.click(form.getByRole("button", { name: "Activate project" }));
    expect(
      await screen.findByText(
        sample("Project activated."),
        {},
        { timeout: 4000 },
      ),
    ).toBeVisible();
  }, 10000);
  it("shows the recorded waiver to a read-only member without activation or history controls", async () => {
    await prepareDraft(wid);
    const repo = getProjectRepository(),
      project = await repo.get(wid, draftId);
    await repo.activate(wid, draftId, {
      expectedVersion: project.version,
      clientPoWaiverReason: "Client PO will join later.",
    });
    __setMockPersona("u-arjun");
    renderPage(draftId);
    await ready();
    expect(
      region("Activation").getByText(
        "Activated without a client Product Owner. Reason: Client PO will join later.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Activate project" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "History" }),
    ).not.toBeInTheDocument();
  });
  it("requires a waiver only when client PO is the only missing item, and records the activated summary", async () => {
    await prepareDraft(wid);
    renderPage(draftId);
    await ready();
    const user = userEvent.setup();
    expect(
      screen.getByRole("button", { name: "Activate project" }),
    ).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Activate project" }));
    const form = within(
      screen.getByRole("dialog", { name: "Activate project" }),
    );
    expect(
      form.getByRole("button", { name: "Activate project" }),
    ).toBeDisabled();
    const reason = form.getByLabelText(
      "Reason for activating without a client Product Owner",
    );
    await user.type(reason, " ");
    await user.tab();
    expect(await form.findByText("Enter a reason.")).toBeVisible();
    await user.clear(reason);
    await user.type(reason, "Client representative will join after kickoff.");
    await user.click(form.getByRole("button", { name: "Activate project" }));
    expect(
      await screen.findByText(
        sample("Project activated."),
        {},
        { timeout: 4000 },
      ),
    ).toBeVisible();
    expect(
      within(
        await screen.findByRole("region", { name: "Activation" }),
      ).getByText(
        "Activated without a client Product Owner. Reason: Client representative will join after kickoff.",
      ),
    ).toBeVisible();
    expect(
      region("Activation").getByText(/Activated .* by Linh Pham/),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Activate project" }),
    ).not.toBeInTheDocument();
    expect(region("Engagement").queryByRole("button")).not.toBeInTheDocument();
  }, 10000);
  it("handles activation failure and success without a waiver for a ready Internal project", async () => {
    const repo = getProjectRepository(),
      created = await repo.create(
        wid,
        {
          name: "Internal readiness",
          purpose: "Verify setup",
          kind: "Internal",
          engagementId: null,
        },
        crypto.randomUUID(),
      );
    const me = (await repo.listParticipants(wid, created.id))[0];
    if (!me) throw new Error("Missing creator");
    await repo.changeRoles(wid, created.id, me.id, {
      roles: ["ProjectAdministrator", "ProjectManager"],
      expectedVersion: me.version,
    });
    await repo.updateBriefItem(wid, created.id, {
      item: "ProductGoal",
      value: "Deliver internal tooling",
      expectedVersion: 1,
    });
    renderPage(created.id);
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Activate project" }));
    const form = within(
      screen.getByRole("dialog", { name: "Activate project" }),
    );
    expect(form.queryByRole("textbox")).not.toBeInTheDocument();
    __setMockFailure("projects.activate", "server");
    await user.click(form.getByRole("button", { name: "Activate project" }));
    expect(await form.findByRole("alert")).toHaveTextContent(
      /outcome is unknown/,
    );
    __setMockFailure("projects.activate", null);
    await user.click(form.getByRole("button", { name: "Activate project" }));
    expect(
      await screen.findByText(
        sample("Project activated."),
        {},
        { timeout: 4000 },
      ),
    ).toBeVisible();
  }, 10000);
  it("renders every server gap in a destructive rejection alert", async () => {
    await prepareDraft(wid);
    renderPage(draftId);
    await ready();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Activate project" }));
    const form = within(
      screen.getByRole("dialog", { name: "Activate project" }),
    );
    await user.type(
      form.getByLabelText(
        "Reason for activating without a client Product Owner",
      ),
      "Approved exception.",
    );
    vi.spyOn(getProjectRepository(), "activate").mockRejectedValueOnce(
      new ProjectActivationError([
        "ProductGoal",
        "SprintLength",
        "ProjectManager",
        "Engagement",
        "ClientProductOwnerWaiver",
      ]),
    );
    await user.click(form.getByRole("button", { name: "Activate project" }));
    const alert = await form.findByRole("alert");
    for (const label of Object.values(READINESS_LABELS))
      expect(within(alert).getByText(label)).toBeVisible();
    expect(
      screen.queryByText(sample("Project activated.")),
    ).not.toBeInTheDocument();
  }, 10000);
});
