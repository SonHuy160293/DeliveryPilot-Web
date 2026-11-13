import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import { ApiError } from "@/lib/api/apiError";
import { draftProject } from "@/test/fixtures/projectMock";
import {
  prepareCollaboration,
  renderCollaboration,
  collaborationTable,
} from "@/test/fixtures/projectCollaboration";
const originalScroll = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);
beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: () => {},
  });
  prepareCollaboration();
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
  vi.restoreAllMocks();
});
describe("project stakeholder register", () => {
  it("loads member rows, side filters and the private details disclosure", async () => {
    renderCollaboration("stakeholders");
    expect(
      await screen.findByText("Loading stakeholders.", {}, { timeout: 4000 }),
    ).toBeInTheDocument();
    const table = await collaborationTable("Stakeholders"),
      user = userEvent.setup();
    expect(
      screen.getByText(
        "Stakeholder entries are a record only. They don't give anyone access.",
      ),
    ).toBeVisible();
    expect(table.getAllByRole("row")).toHaveLength(4);
    expect(
      table.getByRole("columnheader", { name: "Shared" }),
    ).toBeInTheDocument();
    const tomasz = within(table.getByRole("row", { name: /^Tomasz Nowak/ }));
    const details = tomasz.getByText(/Show details/, { selector: "summary" });
    await user.click(details);
    expect(tomasz.getByText("tomasz.nowak@larkspur.example")).toBeVisible();
    screen.getByRole("combobox", { name: "Side" }).focus();
    await user.keyboard("{Enter}{Home}{ArrowDown}{Enter}");
    expect(table.getAllByRole("row")).toHaveLength(2);
    expect(
      table.getByRole("rowheader", { name: "Mai Tran" }),
    ).toBeInTheDocument();
  });
  it.each(["u-mai", "u-linh"] as const)(
    "allows PA/PM %s to open the labeled stakeholder form by keyboard",
    async (persona) => {
      __setMockPersona(persona);
      renderCollaboration("stakeholders");
      await collaborationTable("Stakeholders");
      const user = userEvent.setup(),
        trigger = screen.getByRole("button", { name: "Add stakeholder" });
      trigger.focus();
      await user.keyboard("{Enter}");
      const dialog = within(
        screen.getByRole("dialog", { name: "Add stakeholder" }),
      );
      expect(dialog.getByRole("textbox", { name: "Name" })).toHaveFocus();
      for (const label of [
        "Organization",
        "Responsibilities",
        "Decision areas",
        "Email",
      ])
        expect(dialog.getByRole("textbox", { name: label })).toBeVisible();
      expect(
        dialog.getByRole("combobox", { name: "Linked team member" }),
      ).toBeVisible();
      await user.keyboard("{Escape}");
      expect(trigger).toHaveFocus();
    },
  );
  it.each(["u-sofia", "u-arjun", "u-hannah"] as const)(
    "shows the register but no edit controls to %s",
    async (persona) => {
      __setMockPersona(persona);
      renderCollaboration("stakeholders");
      const table = await collaborationTable("Stakeholders");
      expect(
        screen.queryByRole("button", { name: "Add stakeholder" }),
      ).not.toBeInTheDocument();
      expect(
        table.queryByRole("button", { name: "Edit" }),
      ).not.toBeInTheDocument();
      expect(
        table.queryByRole("button", { name: "Retire stakeholder" }),
      ).not.toBeInTheDocument();
      expect(table.getAllByText(/Show details/)).not.toHaveLength(0);
      expect(
        table.queryByRole("link", { name: /Manage sharing/ }),
      ).not.toBeInTheDocument();
    },
  );
  it("validates on blur and creates a record without granting access", async () => {
    renderCollaboration("stakeholders");
    await collaborationTable("Stakeholders");
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add stakeholder" }));
    const dialog = within(screen.getByRole("dialog")),
      name = dialog.getByLabelText("Name"),
      email = dialog.getByLabelText("Email");
    await user.type(name, "x".repeat(201));
    await user.tab();
    expect(
      await dialog.findByText("Use 200 characters or fewer."),
    ).toBeVisible();
    await user.clear(name);
    await user.type(name, "Delivery sponsor");
    await user.type(email, "invalid");
    await user.tab();
    expect(
      await dialog.findByText("Enter a valid email address."),
    ).toBeVisible();
    await user.clear(email);
    await user.type(email, "sponsor@client.example");
    await user.click(dialog.getByRole("button", { name: "Add stakeholder" }));
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      },
      { timeout: 4000 },
    );
    expect(
      (await collaborationTable("Stakeholders")).getByText("Delivery sponsor"),
    ).toBeVisible();
    expect(
      screen.getByText("Stakeholder saved.", { exact: false }),
    ).toBeVisible();
    expect(
      screen.getByText(/sample data — not saved to a server/),
    ).toBeVisible();
  }, 10000);
  it("edits a stakeholder and uses a confirmed server result", async () => {
    renderCollaboration("stakeholders");
    const table = await collaborationTable("Stakeholders"),
      user = userEvent.setup();
    await user.click(
      within(table.getByRole("row", { name: /^Priya Raman/ })).getByRole(
        "button",
        { name: "Edit" },
      ),
    );
    const dialog = within(screen.getByRole("dialog"));
    await user.clear(dialog.getByLabelText("Name"));
    await user.type(dialog.getByLabelText("Name"), "Executive sponsor");
    await user.click(dialog.getByRole("button", { name: "Save stakeholder" }));
    await waitFor(
      () => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      },
      { timeout: 4000 },
    );
    expect(table.getByText("Executive sponsor")).toBeVisible();
  }, 10000);
  it("maps a rejected linked participant to its field and retains entered values", async () => {
    renderCollaboration("stakeholders");
    await collaborationTable("Stakeholders");
    const user = userEvent.setup();
    vi.spyOn(getProjectRepository(), "saveStakeholder").mockRejectedValueOnce(
      new ApiError("validation", "Check the highlighted fields.", {
        status: 422,
        fieldErrors: {
          participantId: ["Choose someone on the team, or leave this empty."],
        },
      }),
    );
    await user.click(screen.getByRole("button", { name: "Add stakeholder" }));
    const dialog = within(screen.getByRole("dialog"));
    await user.type(dialog.getByLabelText("Name"), "Sponsor");
    await user.click(dialog.getByRole("button", { name: "Add stakeholder" }));
    expect(
      await dialog.findByText(
        "Choose someone on the team, or leave this empty.",
      ),
    ).toBeVisible();
    expect(
      dialog.getByRole("combobox", { name: "Linked team member" }),
    ).toHaveAttribute("aria-invalid", "true");
    expect(dialog.getByLabelText("Name")).toHaveValue("Sponsor");
    expect(
      dialog.getByRole("combobox", { name: "Linked team member" }),
    ).toHaveFocus();
  });
  it("retires a shared stakeholder, withdraws its share and shows an action-free retired row", async () => {
    renderCollaboration("stakeholders");
    const table = await collaborationTable("Stakeholders"),
      user = userEvent.setup();
    const row = within(table.getByRole("row", { name: /^Tomasz Nowak/ }));
    await row.findByText("Shared");
    await user.click(row.getByRole("button", { name: "Retire stakeholder" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(
      dialog.getByText(
        "The entry stays in history. If it is shared with the client, sharing ends.",
      ),
    ).toBeVisible();
    await user.click(
      dialog.getByRole("button", { name: "Retire stakeholder" }),
    );
    expect(
      await screen.findByText(
        "Stakeholder retired.",
        { exact: false },
        { timeout: 4000 },
      ),
    ).toBeVisible();
    expect(table.queryByText("Tomasz Nowak")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByRole("checkbox", { name: "Show retired" }),
      ).toHaveFocus();
    });
    await user.click(screen.getByRole("checkbox", { name: "Show retired" }));
    const retired = within(
      await screen.findByRole("row", { name: /^Tomasz Nowak/ }),
    );
    expect(retired.getByText("Retired")).toBeVisible();
    expect(await retired.findByText("Internal")).toBeVisible();
    expect(retired.queryByRole("button")).not.toBeInTheDocument();
  }, 10000);
  it("keeps an unsuccessful retirement active and shows the failure inside the confirmation", async () => {
    renderCollaboration("stakeholders");
    const table = await collaborationTable("Stakeholders"),
      user = userEvent.setup();
    __setMockFailure("projects.retireStakeholder", "server");
    await user.click(
      within(table.getByRole("row", { name: /^Tomasz Nowak/ })).getByRole(
        "button",
        { name: "Retire stakeholder" },
      ),
    );
    const dialog = within(screen.getByRole("dialog"));
    await user.click(
      dialog.getByRole("button", { name: "Retire stakeholder" }),
    );
    expect(await dialog.findByRole("alert")).toBeVisible();
    expect(
      table.getByRole("rowheader", { name: "Tomasz Nowak", hidden: true }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Stakeholder retired.")).not.toBeInTheDocument();
  });
  it("shows the genuine empty register and safe read-error recovery", async () => {
    __setMockFailure("projects.listStakeholders", "server");
    renderCollaboration("stakeholders", draftProject.detail.id);
    const retry = await screen.findByRole(
      "button",
      { name: "Retry loading stakeholders" },
      { timeout: 5000 },
    );
    __setMockFailure("projects.listStakeholders", null);
    await userEvent.click(retry);
    expect(
      await screen.findByRole(
        "heading",
        { name: "No stakeholders recorded" },
        { timeout: 4000 },
      ),
    ).toBeVisible();
    expect(
      screen.getByText(
        "Add the people who make or influence decisions on this project.",
      ),
    ).toBeVisible();
  }, 10000);
});
