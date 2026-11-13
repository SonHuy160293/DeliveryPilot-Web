import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetMocks,
  __setMockFailure,
  __setMockPersona,
} from "@/mocks/mockRuntime";
import { getSharingRepository } from "@/features/sharing/api/sharingRepository";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import { guestShareFixtures } from "@/mocks/portal";
import {
  firstProject,
  internalProject,
  projectPerson,
} from "@/test/fixtures/projectMock";
import {
  prepareCollaboration,
  renderCollaboration,
  collaborationTable,
  collaborationWorkspace as wid,
  collaborationProject as id,
} from "@/test/fixtures/projectCollaboration";
const conflict =
  "Sharing changed while you were working. Showing the latest state.";
beforeEach(prepareCollaboration);
afterEach(() => {
  __resetMocks();
  vi.restoreAllMocks();
});
describe("client sharing", () => {
  it("hides share controls after a repository permission denial", async () => {
    __setMockFailure("sharing.context", "forbidden");
    renderCollaboration("sharing");
    expect(
      await screen.findByText(
        "Access to this operation is unavailable. Your other workspace access has not been changed.",
        {},
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /^Share .* with guests$/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Withdraw" }),
    ).not.toBeInTheDocument();
  });
  it("loads three groups, omits Product Goal and retired entries, and shows textual statuses", async () => {
    renderCollaboration("sharing");
    expect(
      await screen.findByText("Loading client sharing.", {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    const table = await collaborationTable("Brief items");
    expect(table.getAllByRole("row")).toHaveLength(7);
    expect(
      table.queryByRole("row", { name: /Product Goal/ }),
    ).not.toBeInTheDocument();
    expect(table.getByRole("row", { name: /Problem/ })).toHaveTextContent(
      "Shared",
    );
    expect(
      table.getByRole("row", { name: /Objectives and success criteria/ }),
    ).toHaveTextContent("Internal");
    expect(
      (await collaborationTable("Stakeholder entries")).queryByText(
        "Store IT liaison (vacant)",
      ),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Engagement summary" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Sharing applies to every current and future guest/),
    ).toBeVisible();
    expect(
      screen.getByText(/Sample data. This page is not connected/),
    ).toBeVisible();
  });
  it("shares directly, then withdraws with an optional reason and records both actions", async () => {
    renderCollaboration("sharing");
    const user = userEvent.setup(),
      table = await collaborationTable("Brief items");
    await user.click(
      table.getByRole("button", {
        name: "Share Objectives and success criteria with guests",
      }),
    );
    expect(
      await screen.findByText(
        "Objectives and success criteria is now shared with this project's guests.",
        { exact: false },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    const row = within(
      table.getByRole("row", { name: /Objectives and success criteria/ }),
    );
    expect(row.getByRole("button", { name: "Withdraw" })).toHaveFocus();
    await user.click(row.getByRole("button", { name: "Withdraw" }));
    const dialog = within(
      screen.getByRole("dialog", {
        name: "Withdraw: Objectives and success criteria",
      }),
    );
    expect(
      dialog.getByText(
        "Guests lose access on their next visit. This can't undo anything they already read.",
      ),
    ).toBeVisible();
    await user.type(
      dialog.getByLabelText("Reason (optional)"),
      "Internal review",
    );
    await user.click(dialog.getByRole("button", { name: "Withdraw" }));
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
    expect(row.getByText("Internal")).toBeInTheDocument();
    await waitFor(
      () => {
        expect(
          row.getByRole("button", {
            name: "Share Objectives and success criteria with guests",
          }),
        ).toHaveFocus();
      },
      { timeout: 5000 },
    );
    await user.click(screen.getByText("History", { selector: "summary" }));
    const history = await collaborationTable("Sharing history");
    expect(
      history.getByRole("row", {
        name: /Objectives and success criteria Withdrawn Internal review/,
      }),
    ).toHaveTextContent("Linh Pham");
    expect(
      screen.getByText(/sample data — not saved to a server/),
    ).toBeVisible();
  }, 15000);
  it("handles a concurrent withdrawal by refetching and showing the final state", async () => {
    renderCollaboration("sharing");
    const user = userEvent.setup(),
      table = await collaborationTable("Brief items"),
      row = within(table.getByRole("row", { name: /^Problem / }));
    await user.click(row.getByRole("button", { name: "Withdraw" }));
    await act(async () => {
      await getSharingRepository().withdraw(wid, id, guestShareFixtures[0].id, {
        expectedVersion: 1,
        reason: "Another editor",
      });
    });
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Withdraw",
      }),
    );
    expect(
      await screen.findByText(conflict, {}, { timeout: 5000 }),
    ).toBeVisible();
    expect(row.getByText("Internal")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  }, 10000);
  it("offers a read-only client preview without exposing unshared content or private fields", async () => {
    renderCollaboration("sharing");
    await collaborationTable("Brief items");
    const user = userEvent.setup(),
      toggle = screen.getByRole("button", { name: "Preview as client" });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    const preview = screen.getByRole("region", { name: "Client preview" });
    expect(
      await within(preview).findByRole(
        "region",
        { name: "Shared with you" },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(preview).not.toHaveTextContent(
      firstProject.brief.objectivesAndSuccessCriteria ?? "private value",
    );
    expect(preview.textContent).not.toMatch(/@|AUD|185,000|person-days/);
    expect(within(preview).queryByRole("button")).not.toBeInTheDocument();
    await user.keyboard(" ");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
  it.each(["u-sofia", "u-arjun", "u-hannah"] as const)(
    "falls back to overview for %s without fetching sharing management",
    async (persona) => {
      __setMockPersona(persona);
      const history = vi.spyOn(getSharingRepository(), "history"),
        context = vi.spyOn(getSharingRepository(), "context");
      renderCollaboration("sharing");
      await screen.findByRole("heading", { name: "Brief" }, { timeout: 4000 });
      expect(
        screen.queryByRole("tab", { name: "Sharing" }),
      ).not.toBeInTheDocument();
      expect(history).not.toHaveBeenCalled();
      expect(context).not.toHaveBeenCalled();
      expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    },
  );
  it("shows the no-engagement note for an Internal project", async () => {
    __setMockPersona("u-daniel");
    renderCollaboration("sharing", internalProject.detail.id);
    await collaborationTable("Brief items");
    expect(
      screen.getByText(
        "This project has no engagement, so there is nothing to share here.",
      ),
    ).toBeVisible();
    expect(
      screen.queryByRole("table", { name: "Engagement summary" }),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("History", { selector: "summary" }));
    expect(
      await screen.findByRole("heading", { name: "No changes recorded yet." }),
    ).toBeVisible();
  });
  it("requires full engagement detail even for a member project manager", async () => {
    const repo = getProjectRepository(),
      target = (await repo.listParticipants(wid, id)).find(
        (row) => row.userId === projectPerson("u-sofia").id,
      );
    if (!target) throw new Error("Missing participant");
    await repo.changeRoles(wid, id, target.id, {
      roles: ["ProjectManager"],
      expectedVersion: target.version,
    });
    __setMockPersona("u-sofia");
    renderCollaboration("sharing");
    await collaborationTable("Brief items");
    const section = within(
      screen.getByRole("region", { name: "Engagement summary" }),
    );
    expect(
      section.getAllByText(
        "Sharing the engagement summary needs engagement read access.",
      ),
    ).not.toHaveLength(0);
    expect(section.queryByRole("button")).not.toBeInTheDocument();
  }, 10000);
  it("shows safe read errors with manual recovery", async () => {
    __setMockFailure("sharing.context", "server");
    renderCollaboration("sharing");
    const retry = await screen.findByRole(
      "button",
      { name: "Retry loading client sharing" },
      { timeout: 5000 },
    );
    expect(
      screen.queryByRole("table", { name: "Brief items" }),
    ).not.toBeInTheDocument();
    __setMockFailure("sharing.context", null);
    await userEvent.click(retry);
    await collaborationTable("Brief items");
  }, 10000);
  it("keeps a failed Share internal and permits a deliberate retry", async () => {
    renderCollaboration("sharing");
    const table = await collaborationTable("Brief items"),
      user = userEvent.setup();
    __setMockFailure("sharing.share", "server");
    const share = table.getByRole("button", {
      name: "Share Assumptions with guests",
    });
    share.focus();
    await user.keyboard("{Enter}");
    const row = within(table.getByRole("row", { name: /Assumptions/ }));
    expect(await row.findByRole("alert")).toBeVisible();
    expect(row.getByText("Internal")).toBeVisible();
    __setMockFailure("sharing.share", null);
    await user.click(share);
    expect(
      await screen.findByText(
        "Assumptions is now shared with this project's guests.",
        { exact: false },
        { timeout: 5000 },
      ),
    ).toBeVisible();
  }, 10000);
});
