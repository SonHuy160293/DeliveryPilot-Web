import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it } from "vitest";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import {
  prepareCollaboration,
  renderCollaboration,
  collaborationTable,
  collaborationWorkspace as wid,
  collaborationProject as id,
} from "@/test/fixtures/projectCollaboration";
import { workspaceProjectPath } from "@/lib/routes";
beforeEach(prepareCollaboration);
afterEach(__resetMocks);
describe("member-only overview share badges", () => {
  it("links a member manager's Shared badge to client sharing and leaves Product Goal unbadged", async () => {
    renderCollaboration("overview");
    const problem = within(
      await screen.findByRole("region", { name: "Problem" }, { timeout: 4000 }),
    );
    expect(await problem.findByText("Shared")).toBeVisible();
    const badge = problem.getByRole("link", {
      name: "Manage sharing for Problem",
    });
    expect(badge).toHaveAttribute(
      "href",
      workspaceProjectPath(wid, id, "sharing"),
    );
    const productGoal = within(
      screen.getByRole("region", { name: "Product Goal" }),
    );
    expect(productGoal.queryByText("Shared")).not.toBeInTheDocument();
    expect(productGoal.queryByText("Internal")).not.toBeInTheDocument();
    badge.focus();
    await userEvent.keyboard("{Enter}");
    await collaborationTable("Brief items");
  }, 10000);
  it("shows textual badges without management links to a read-only member", async () => {
    __setMockPersona("u-arjun");
    renderCollaboration("overview");
    const problem = within(
      await screen.findByRole("region", { name: "Problem" }, { timeout: 4000 }),
    );
    expect(await problem.findByText("Shared")).toBeVisible();
    expect(problem.queryByRole("link")).not.toBeInTheDocument();
    expect(
      await within(
        screen.getByRole("region", { name: "Open questions" }),
      ).findByText("Internal"),
    ).toBeVisible();
  });
});
