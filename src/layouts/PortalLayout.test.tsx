import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { httpClient } from "@/lib/api/httpClient";
import { ROUTES, portalProjectPath } from "@/lib/routes";
import { establishOrganizationSession } from "@/test/fixtures/organizationApi";
import { renderRoute } from "@/test/renderRoute";

describe("client portal shell", () => {
  it.each([
    ROUTES.portal,
    portalProjectPath("abcdef01-2345-6789-abcd-ef0123456789"),
  ])("renders %s without workspace reads or navigation", (path) => {
    establishOrganizationSession();
    const request = vi.spyOn(httpClient, "request");
    renderRoute(path);
    expect(screen.getByRole("main")).toHaveAttribute("tabindex", "-1");
    expect(
      screen.getByRole("link", { name: "Skip to content" }),
    ).toHaveAttribute("href", "#main-content");
    const nav = within(
      screen.getByRole("navigation", { name: "Client portal" }),
    );
    expect(nav.getAllByRole("link")).toHaveLength(1);
    expect(nav.getByRole("link", { name: "My projects" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.queryByRole("button", { name: /switch workspace/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Workspaces" }),
    ).not.toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it("opens the account portal link with the keyboard and closes the menu", async () => {
    establishOrganizationSession();
    renderRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "User account" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const portal = within(
      screen.getByRole("dialog", { name: "User account details" }),
    ).getByRole("link", { name: "Client portal" });
    for (
      let count = 0;
      count < 12 && document.activeElement !== portal;
      count++
    )
      await user.tab();
    expect(portal).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(
      await screen.findByRole("heading", { name: "My projects" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "User account details" }),
    ).not.toBeInTheDocument();
  });

  it("supports the portal Sheet with Enter, Tab and Escape", async () => {
    establishOrganizationSession();
    renderRoute(ROUTES.portal);
    const user = userEvent.setup();
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const sheet = within(screen.getByRole("dialog", { name: "Client portal" }));
    const projects = sheet.getByRole("link", { name: "My projects" });
    for (
      let count = 0;
      count < 5 && document.activeElement !== projects;
      count++
    )
      await user.tab();
    expect(projects).toHaveFocus();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    await user.keyboard("{Enter}");
    await user.click(
      within(screen.getByRole("dialog", { name: "Client portal" })).getByRole(
        "link",
        { name: "My projects" },
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Client portal" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("reuses the existing accessible theme control", async () => {
    establishOrganizationSession();
    renderRoute(ROUTES.portal);
    const user = userEvent.setup();
    const toggle = screen.getByRole("button", { name: "Switch to dark mode" });
    toggle.focus();
    await user.keyboard("{Enter}");
    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("deliverypilot-theme")).toBe("dark");
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toHaveFocus();
  });
});
