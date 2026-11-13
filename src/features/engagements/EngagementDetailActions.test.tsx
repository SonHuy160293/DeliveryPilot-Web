import {
  act,
  fireEvent,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getEngagementRepository } from "@/features/engagements/api/engagementRepository";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { ApiError } from "@/lib/api/apiError";
import {
  establishOrganizationSession,
  organizationReadHandlers,
} from "@/test/fixtures/organizationApi";
import { server } from "@/test/mocks/server";
import {
  detailFixture,
  closedFixture,
  detailWorkspaceId,
  renderDetail,
  detailReady,
  openDetailAction,
  milestoneRow,
} from "@/test/fixtures/engagementDetail";

beforeEach(() => {
  __resetMocks();
  __setMockPersona("u-mai");
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
});
afterEach(() => {
  __resetMocks();
});

const actions = [
  {
    operation: "setContractValue",
    tab: "contract",
    trigger: "Set contract value",
    submit: "Set contract value",
    result: "Contract value updated.",
  },
  {
    operation: "close",
    tab: "details",
    trigger: "Close engagement",
    submit: "Close engagement",
    result: "Engagement closed.",
  },
  {
    operation: "reopen",
    tab: "details",
    trigger: "Reopen engagement",
    submit: "Reopen engagement",
    result: "Engagement reopened.",
  },
  {
    operation: "addMilestone",
    tab: "milestones",
    trigger: "Add milestone",
    submit: "Add milestone",
    result: "Milestone added.",
  },
  {
    operation: "editMilestone",
    tab: "milestones",
    trigger: "Edit",
    submit: "Edit milestone",
    result: "Milestone updated.",
    row: true,
  },
  {
    operation: "changeMilestoneDate",
    tab: "milestones",
    trigger: "Change date",
    submit: "Change date",
    result: "Milestone date changed.",
    row: true,
  },
  {
    operation: "changeMilestoneStatus",
    tab: "milestones",
    trigger: "Change status",
    submit: "Change status",
    result: "Milestone marked Achieved.",
    row: true,
  },
] as const;
async function fillAction(operation: string) {
  const user = userEvent.setup();
  if (operation === "setContractValue") {
    await user.clear(screen.getByLabelText("Amount"));
    await user.type(screen.getByLabelText("Amount"), "190000.25");
  } else if (operation === "addMilestone") {
    await user.type(screen.getByLabelText("Name"), "Handover");
    fireEvent.change(screen.getByLabelText("Target date"), {
      target: { value: "2027-05-01" },
    });
  } else if (operation === "editMilestone") {
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Revised beta");
  } else if (operation === "changeMilestoneDate") {
    fireEvent.change(screen.getByLabelText("New target date"), {
      target: { value: "2027-02-01" },
    });
  }
  const reason = screen.queryByLabelText("Reason");
  if (reason) await user.type(reason, "Agreed with the client");
}
describe("versioned detail actions", () => {
  it.each(actions)(
    "$operation succeeds with verified sample feedback",
    async (action) => {
      const fixture =
        action.operation === "reopen" ? closedFixture : detailFixture;
      renderDetail(action.tab, fixture.id);
      await detailReady(fixture.clientDisplayName);
      const user = userEvent.setup();
      const target = "row" in action ? milestoneRow() : screen;
      await user.click(target.getByRole("button", { name: action.trigger }));
      await fillAction(action.operation);
      await user.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: action.submit,
        }),
      );
      expect(
        await screen.findByText(
          `${action.result} (sample data — not saved to a server)`,
        ),
      ).toBeVisible();
      await waitFor(() =>
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
      );
      const row = await getEngagementRepository().get(
        detailWorkspaceId,
        fixture.id,
      );
      switch (action.operation) {
        case "setContractValue":
          expect(row.contractAmount).toBe(190000.25);
          break;
        case "close":
          expect(row.status).toBe("Closed");
          expect(
            screen.queryByRole("link", { name: "Create project" }),
          ).not.toBeInTheDocument();
          break;
        case "reopen":
          expect(row.status).toBe("Active");
          break;
        case "addMilestone":
          expect(row.milestones.at(-1)?.name).toBe("Handover");
          expect(row.milestones.at(-1)?.version).toBe(1);
          break;
        case "editMilestone":
          expect(row.milestones[1]?.name).toBe("Revised beta");
          break;
        case "changeMilestoneDate":
          expect(row.milestones[1]?.currentTargetDate).toBe("2027-02-01");
          expect(row.milestones[1]?.originalTargetDate).toBe("2026-12-15");
          expect(milestoneRow().getByText("15 Dec 2026")).toBeVisible();
          break;
        case "changeMilestoneStatus":
          expect(row.milestones[1]?.status).toBe("Achieved");
          expect(milestoneRow().queryByRole("button")).not.toBeInTheDocument();
          break;
      }
    },
  );
  it.each(actions)(
    "$operation fails without fake success and retains input",
    async (action) => {
      const fixture =
        action.operation === "reopen" ? closedFixture : detailFixture;
      __setMockFailure(`engagements.${action.operation}`, "server");
      const write = vi.spyOn(getEngagementRepository(), action.operation);
      renderDetail(action.tab, fixture.id);
      await detailReady(fixture.clientDisplayName);
      const user = userEvent.setup();
      await user.click(
        ("row" in action ? milestoneRow() : screen).getByRole("button", {
          name: action.trigger,
        }),
      );
      await fillAction(action.operation);
      const dialog = within(screen.getByRole("dialog"));
      await user.click(dialog.getByRole("button", { name: action.submit }));
      expect(await dialog.findByRole("alert")).toBeVisible();
      expect(write).toHaveBeenCalledOnce();
      expect(
        screen.queryByText(
          `${action.result} (sample data — not saved to a server)`,
        ),
      ).not.toBeInTheDocument();
      const input = dialog.queryByLabelText("Name");
      if (input) expect(input).not.toHaveValue("");
    },
  );
  it("locks currency until both amount and currency have been cleared in a confirmed write", async () => {
    renderDetail("contract");
    const { user, dialog } = await openDetailAction("Set contract value");
    const currency = dialog.getByLabelText("Currency");
    expect(currency).toHaveAttribute("readonly");
    await user.type(currency, "USD");
    expect(currency).toHaveValue("AUD");
    await user.click(
      dialog.getByRole("checkbox", { name: "Clear amount and currency" }),
    );
    await user.click(
      dialog.getByRole("button", { name: "Set contract value" }),
    );
    await screen.findByText(/Contract value updated. \(sample data/);
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    await user.click(
      screen.getByRole("button", { name: "Set contract value" }),
    );
    expect(screen.getByLabelText("Amount")).toHaveValue("");
    expect(screen.getByLabelText("Currency")).not.toHaveAttribute("readonly");
    await user.type(screen.getByLabelText("Currency"), "usd");
    await user.type(screen.getByLabelText("Amount"), "0");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Set contract value",
      }),
    );
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(screen.getByText(/USD\s0.00/)).toBeVisible();
  });
  it("validates contract precision and required reasons on blur", async () => {
    renderDetail("contract");
    const { user, dialog } = await openDetailAction("Set contract value");
    await user.clear(dialog.getByLabelText("Amount"));
    await user.type(dialog.getByLabelText("Amount"), "-1.234");
    await user.tab();
    expect(await dialog.findByText(/up to two decimal places/)).toBeVisible();
    await user.clear(dialog.getByLabelText("Planned effort (person-days)"));
    await user.type(
      dialog.getByLabelText("Planned effort (person-days)"),
      "2.22",
    );
    await user.tab();
    expect(await dialog.findByText(/up to one decimal place/)).toBeVisible();
  });
  it("requires reasons for close and date changes without making requests", async () => {
    const close = vi.spyOn(getEngagementRepository(), "close");
    renderDetail();
    const { user, dialog } = await openDetailAction("Close engagement");
    expect(
      dialog.getByText(
        "Edits and new projects will be blocked. Existing projects keep working.",
      ),
    ).toBeVisible();
    await user.click(dialog.getByRole("button", { name: "Close engagement" }));
    expect(await dialog.findByText("Enter a reason.")).toBeVisible();
    expect(close).not.toHaveBeenCalled();
    await user.click(dialog.getByRole("button", { name: "Cancel" }));
    await user.click(screen.getByRole("tab", { name: /Milestones/ }));
    await user.click(
      milestoneRow().getByRole("button", { name: "Change date" }),
    );
    expect(
      screen.getByText("Original date 15 Dec 2026 stays recorded."),
    ).toBeVisible();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Change date",
      }),
    );
    expect(await screen.findByText("Enter a reason.")).toBeVisible();
  });
  it("reloads conflicting server values in the open dialog, then submits the new version", async () => {
    const repo = getEngagementRepository();
    renderDetail("contract");
    const { user, dialog } = await openDetailAction("Set contract value");
    await user.clear(dialog.getByLabelText("Amount"));
    await user.type(dialog.getByLabelText("Amount"), "195000");
    await act(async () => {
      await repo.setContractValue(detailWorkspaceId, detailFixture.id, {
        expectedVersion: detailFixture.version,
        contractAmount: 188000,
        contractCurrency: "AUD",
        plannedEffortPersonDays: 430,
        reason: null,
      });
    });
    await user.click(
      dialog.getByRole("button", { name: "Set contract value" }),
    );
    expect(
      await dialog.findByText(
        "Someone else changed this. Reload to see the latest version.",
      ),
    ).toBeVisible();
    expect(dialog.getByLabelText("Amount")).toHaveValue("195000");
    await user.click(dialog.getByRole("button", { name: "Reload" }));
    await waitFor(() =>
      expect(dialog.getByLabelText("Amount")).toHaveValue("188000"),
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    await user.clear(dialog.getByLabelText("Amount"));
    await user.type(dialog.getByLabelText("Amount"), "196000");
    await user.click(
      dialog.getByRole("button", { name: "Set contract value" }),
    );
    await screen.findByText(/Contract value updated. \(sample data/);
  });
  it("maps server field errors and returns focus on cancel", async () => {
    vi.spyOn(getEngagementRepository(), "setContractValue").mockRejectedValue(
      new ApiError("validation", "Invalid", {
        status: 422,
        fieldErrors: { contractAmount: ["Review the contract amount."] },
      }),
    );
    renderDetail("contract");
    const { user, dialog } = await openDetailAction("Set contract value");
    await user.click(
      dialog.getByRole("button", { name: "Set contract value" }),
    );
    expect(
      await dialog.findByText(
        "The server rejected this value. Review it before submitting again.",
      ),
    ).toBeVisible();
    expect(dialog.getByLabelText("Amount")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await user.click(dialog.getByRole("button", { name: "Cancel" }));
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Set contract value" }),
      ).toHaveFocus(),
    );
  });
  it("offers only Missed to Achieved or Retired transitions", async () => {
    const item = detailFixture.milestones[1];
    if (!item) throw new Error("Missing milestone");
    await getEngagementRepository().changeMilestoneStatus(
      detailWorkspaceId,
      detailFixture.id,
      item.id,
      { expectedVersion: item.version, status: "Missed", reason: null },
    );
    renderDetail("milestones");
    const { dialog } = await openDetailAction("Change status", true);
    expect(
      dialog.getAllByRole("radio").map((radio) => radio.getAttribute("value")),
    ).toEqual(["Achieved", "Retired"]);
    expect(dialog.queryByLabelText("Planned")).not.toBeInTheDocument();
  });
  it("keeps Reload open with read-only server values if the engagement was closed elsewhere", async () => {
    const repo = getEngagementRepository();
    renderDetail("contract");
    const { user, dialog } = await openDetailAction("Set contract value");
    await user.clear(dialog.getByLabelText("Amount"));
    await user.type(dialog.getByLabelText("Amount"), "190000");
    await act(async () => {
      await repo.close(detailWorkspaceId, detailFixture.id, {
        expectedVersion: detailFixture.version,
        reason: "Completed elsewhere",
      });
    });
    await user.click(
      dialog.getByRole("button", { name: "Set contract value" }),
    );
    await user.click(await dialog.findByRole("button", { name: "Reload" }));
    await waitFor(() =>
      expect(dialog.getByLabelText("Amount")).toHaveValue("185000"),
    );
    expect(dialog.getByLabelText("Amount")).toHaveAttribute("readonly");
    expect(
      dialog.getByRole("button", { name: "Set contract value" }),
    ).toBeDisabled();
    expect(screen.getByRole("dialog")).toBeVisible();
  });
  it("keeps a conflict Reload open when a milestone became terminal, with all editing disabled", async () => {
    const item = detailFixture.milestones[1];
    if (!item) throw new Error("Missing milestone");
    renderDetail("milestones");
    const { user, dialog } = await openDetailAction("Change date", true);
    await user.type(dialog.getByLabelText("Reason"), "Replanning");
    await act(async () => {
      await getEngagementRepository().changeMilestoneStatus(
        detailWorkspaceId,
        detailFixture.id,
        item.id,
        { expectedVersion: item.version, status: "Achieved", reason: null },
      );
    });
    await user.click(dialog.getByRole("button", { name: "Change date" }));
    await user.click(await dialog.findByRole("button", { name: "Reload" }));
    await waitFor(() =>
      expect(
        dialog.getByRole("button", { name: "Change date" }),
      ).toBeDisabled(),
    );
    expect(dialog.getByLabelText("New target date")).toHaveAttribute(
      "readonly",
    );
    expect(screen.getByRole("dialog")).toBeVisible();
  });
});
