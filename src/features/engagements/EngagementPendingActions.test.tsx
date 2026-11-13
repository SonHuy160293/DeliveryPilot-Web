import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import {
  establishOrganizationSession,
  organizationReadHandlers,
} from "@/test/fixtures/organizationApi";
import { server } from "@/test/mocks/server";
import { renderDetail, detailReady } from "@/test/fixtures/engagementDetail";
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
  __setMockPersona("u-mai");
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
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
describe("engagement pending actions", () => {
  it("requires a reason for changing an agreement reference and saves mock details", async () => {
    renderDetail();
    await detailReady();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Edit details" }));
    const dialog = within(screen.getByRole("dialog"));
    await user.clear(dialog.getByLabelText("Agreement reference"));
    await user.type(
      dialog.getByLabelText("Agreement reference"),
      "UPDATED-123",
    );
    await user.click(dialog.getByRole("button", { name: "Save details" }));
    expect(await dialog.findByText("Enter a reason.")).toBeVisible();
    await user.type(dialog.getByLabelText("Reason"), "Corrected agreement");
    await user.click(dialog.getByRole("button", { name: "Save details" }));
    expect(
      await screen.findByText(
        "Engagement details updated.",
        { exact: false },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(screen.getByText("UPDATED-123")).toBeVisible();
  }, 10000);
  it("warns when replacing the client Product Owner and saves one designation", async () => {
    renderDetail("contacts");
    await detailReady();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Add contact" }));
    const dialog = within(screen.getByRole("dialog"));
    await user.type(dialog.getByLabelText("Name"), "New owner");
    await user.type(dialog.getByLabelText("Email"), "owner@client.example");
    dialog.getByRole("combobox", { name: "Contact role" }).focus();
    await user.keyboard("{Enter}{Home}{Enter}");
    expect(
      dialog.getByText("This replaces Tomasz Nowak as client Product Owner."),
    ).toBeVisible();
    await user.click(dialog.getByRole("button", { name: "Save contact" }));
    expect(
      await screen.findByText(
        "Contact saved.",
        { exact: false },
        { timeout: 5000 },
      ),
    ).toBeVisible();
    const table = within(screen.getByRole("table", { name: "Contacts" }));
    expect(table.getByRole("row", { name: /New owner/ })).toHaveTextContent(
      "Client Product Owner",
    );
    expect(table.getByRole("row", { name: /Tomasz Nowak/ })).toHaveTextContent(
      "Other",
    );
  }, 10000);
  it("links project names only when the caller participates", async () => {
    __setMockPersona("u-daniel");
    renderDetail("projects");
    await detailReady();
    const table = within(
      await screen.findByRole(
        "table",
        { name: "Projects under this engagement" },
        { timeout: 5000 },
      ),
    );
    expect(table.getByText("Loyalty platform – Phase 1")).toBeInTheDocument();
    expect(
      table.queryByRole("link", { name: "Loyalty platform – Phase 1" }),
    ).not.toBeInTheDocument();
  });
  it("keeps edit controls unavailable to read-all users and on closed engagements", async () => {
    __setMockPersona("u-linh");
    renderDetail("contacts");
    await detailReady();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Add contact" }),
      ).not.toBeInTheDocument(),
    );
  });
});
