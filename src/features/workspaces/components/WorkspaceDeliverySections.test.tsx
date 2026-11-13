import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { workspaceOverviewPath } from "@/lib/routes";
import { workspaceSectionSearch } from "@/lib/workspaceSections";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import { organizationIds } from "@/mocks/workspaces";
import {
  establishOrganizationSession,
  organizationReadHandlers,
} from "@/test/fixtures/organizationApi";
import { server } from "@/test/mocks/server";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";

const scroll = Object.getOwnPropertyDescriptor(
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
  if (scroll)
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scroll);
  else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});
function renderSection(section: "client-links" | "projects-recovery") {
  renderOrganizationRoute(
    `${workspaceOverviewPath(organizationIds.organization)}${workspaceSectionSearch(section)}`,
  );
}
describe("workspace delivery sections", () => {
  it("shows a generic invalid-code error and confirms the supplied fixture code", async () => {
    renderSection("client-links");
    const user = userEvent.setup();
    const input = await screen.findByLabelText("Link code");
    await user.type(input, "invalid");
    await user.click(screen.getByRole("button", { name: "Check code" }));
    expect(
      await screen.findByText(
        "This code can't be used. Ask the vendor for a new code.",
      ),
    ).toBeVisible();
    await user.clear(input);
    await user.type(input, "7kq4-mz2p-h9td");
    await user.click(screen.getByRole("button", { name: "Check code" }));
    const dialog = within(
      await screen.findByRole("dialog", { name: "Confirm client link" }),
    );
    expect(dialog.getByText("Engagement: Fleet telemetry MVP")).toBeVisible();
    await user.click(dialog.getByRole("button", { name: "Confirm link" }));
    expect(
      await screen.findByText(/Engagement linked\./, {}, { timeout: 5000 }),
    ).toBeVisible();
    expect(
      within(
        screen.getByRole("table", { name: "Linked engagements" }),
      ).getByText("Fleet telemetry MVP"),
    ).toBeVisible();
    expect(input).toHaveValue("");
  }, 10000);
  it("requires a reason and appoints an eligible administrator", async () => {
    renderSection("projects-recovery");
    const user = userEvent.setup();
    const table = within(
      await screen.findByRole("table", {
        name: "Projects without an administrator",
      }),
    );
    await user.click(
      table.getByRole("button", { name: "Appoint administrator" }),
    );
    const dialog = within(screen.getByRole("dialog"));
    dialog.getByRole("combobox", { name: "Member participant" }).focus();
    await user.keyboard("{Enter}{Home}{Enter}");
    await user.click(
      dialog.getByRole("button", { name: "Appoint administrator" }),
    );
    expect(await dialog.findByText("Enter a reason.")).toBeVisible();
    await user.type(
      dialog.getByLabelText("Reason"),
      "Restore project administration",
    );
    await user.click(
      dialog.getByRole("button", { name: "Appoint administrator" }),
    );
    expect(
      await screen.findByText(
        /Arjun Mehta is now an administrator of Warehouse scanner app\./,
        {},
        { timeout: 5000 },
      ),
    ).toBeVisible();
    expect(
      await screen.findByText("Every project has an active administrator."),
    ).toBeVisible();
  }, 10000);
});
