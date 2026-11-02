import { screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";
import { organizationFixtures as f } from "@/mocks/workspaces";
import { server } from "@/test/mocks/server";
import {
  apiBase,
  establishOrganizationSession,
  success,
  organizationReadHandlers,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";

describe("connected workspace creation", () => {
  beforeEach(() => {
    server.use(...organizationReadHandlers);
  });
  it("validates name, sends only the trimmed name, and ignores preview state", async () => {
    establishOrganizationSession();
    let calls = 0;
    server.use(
      http.post(`${apiBase}/organizations`, async ({ request }) => {
        calls++;
        expect(await request.json()).toEqual({ name: "Cedar delivery" });
        expect(request.headers.get("idempotency-key")).toMatch(
          /^[\da-f-]{36}$/i,
        );
        return success(f.creation, 201);
      }),
    );
    renderOrganizationRoute(`${ROUTES.workspaces}?state=no-permission`);
    const user = userEvent.setup();
    await user.click(
      within(
        screen.getByRole("region", { name: "Workspace portfolio" }),
      ).getByRole("button", { name: "Create workspace" }),
    );
    const dialog = screen.getByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: "Create workspace" }),
    );
    expect(screen.getByLabelText("Workspace name")).toHaveAccessibleDescription(
      "Enter a workspace name.",
    );
    expect(screen.queryByLabelText("Workspace slug")).not.toBeInTheDocument();
    expect(calls).toBe(0);
    await user.type(
      screen.getByLabelText("Workspace name"),
      "  Cedar delivery  ",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create workspace" }),
    );
    expect(
      await screen.findByText(/Workspace creation was confirmed/),
    ).toBeVisible();
    expect(calls).toBe(1);
    expect(
      Object.keys(localStorage).filter((key) => key !== "deliverypilot-theme"),
    ).toEqual([]);
  });
  it("retains one intent across malformed success, dialog closure, and an authorized replay", async () => {
    establishOrganizationSession();
    const attempts: (string | null)[] = [];
    let count = 0;
    server.use(
      http.post(`${apiBase}/organizations`, ({ request }) => {
        attempts.push(request.headers.get("idempotency-key"));
        count++;
        return count === 1
          ? success({ malformed: true }, 201)
          : success(f.creation, 200);
      }),
    );
    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    await user.click(
      within(
        screen.getByRole("region", { name: "Workspace portfolio" }),
      ).getByRole("button", { name: "Create workspace" }),
    );
    await user.type(screen.getByLabelText("Workspace name"), f.creation.name);
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create workspace",
      }),
    );
    expect(await screen.findByText(/The outcome is unknown/)).toBeVisible();
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Close creation",
      }),
    );
    await user.click(
      within(
        screen.getByRole("region", { name: "Workspace portfolio" }),
      ).getByRole("button", { name: "Create workspace" }),
    );
    expect(screen.getByLabelText("Workspace name")).toHaveValue(
      f.creation.name,
    );
    await user.click(
      screen.getByRole("button", { name: "Retry same attempt" }),
    );
    expect(
      await screen.findByText(/Workspace creation was confirmed/),
    ).toBeVisible();
    expect(attempts).toHaveLength(2);
    expect(attempts[0]).toBe(attempts[1]);
  });
  it("opens one dialog from header and returns focus to its trigger", async () => {
    establishOrganizationSession();
    renderOrganizationRoute(ROUTES.workspaces);
    await screen.findByRole("link", {
      name: `Open workspace ${f.workspace.name}`,
    });
    const portfolio = screen.getByRole("region", {
      name: "Workspace portfolio",
    });
    const trigger = within(portfolio).getByRole("button", {
      name: "Create workspace",
    });
    const user = userEvent.setup();
    await user.click(trigger);
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
  it("contains keyboard focus and restores it after Escape without sending a write", async () => {
    establishOrganizationSession();
    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    const trigger = within(
      screen.getByRole("region", { name: "Workspace portfolio" }),
    ).getByRole("button", { name: "Create workspace" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await waitFor(() => {
      expect(screen.getByLabelText("Workspace name")).toHaveFocus();
    });
    const dialog = screen.getByRole("dialog");
    for (let index = 0; index < 5; index++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });
});
