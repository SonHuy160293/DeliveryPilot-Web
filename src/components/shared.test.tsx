import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ROUTES } from "@/lib/routes";
import { authSession } from "@/lib/api/authSession";
import { renderRoute } from "@/test/renderRoute";

describe("shared compositions", () => {
  it("renders a page heading and navigable breadcrumb", () => {
    render(
      <MemoryRouter>
        <PageHeader
          title="Workspace overview"
          description="Preview details"
          breadcrumbs={[
            { label: "Workspaces", to: ROUTES.workspaces },
            { label: "Overview" },
          ]}
        />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { level: 1, name: "Workspace overview" }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Workspaces" })).toHaveAttribute(
      "href",
      ROUTES.workspaces,
    );
    expect(screen.getByText("Overview")).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("explains absence and a useful next step", () => {
    render(
      <EmptyState
        title="No content yet"
        description="Return to workspaces to continue."
      />,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: "No content yet" }),
    ).toBeVisible();
    expect(screen.getByText("Return to workspaces to continue.")).toBeVisible();
  });

  it("defaults to light mode and keeps the sidebar surface styled with bg-card", () => {
    authSession.establish(
      {
        userId: "00000000-0000-0000-0000-000000000001",
        accessToken: "test.header.signature",
        expiresAt: Date.now() + 60_000,
      },
      authSession.begin(),
    );
    renderRoute(ROUTES.workspaces);
    expect(document.documentElement).not.toHaveClass("dark");
    expect(
      screen.getByRole("complementary", { name: "Workspace sidebar" }),
    ).toHaveClass("bg-card");
  });

  it("collapses the sidebar to icons and expands it again", async () => {
    const user = userEvent.setup();
    authSession.establish(
      {
        userId: "00000000-0000-0000-0000-000000000001",
        accessToken: "test.header.signature",
        expiresAt: Date.now() + 60_000,
      },
      authSession.begin(),
    );
    renderRoute(ROUTES.workspaces);
    const sidebar = screen.getByRole("complementary", {
      name: "Workspace sidebar",
    });
    expect(sidebar).toHaveClass("w-64");
    const collapse = screen.getByRole("button", { name: "Collapse sidebar" });
    expect(collapse).toHaveAttribute("aria-expanded", "true");

    await user.click(collapse);
    expect(sidebar).toHaveClass("w-16");
    expect(
      within(sidebar).getByRole("link", { name: "Workspaces" }),
    ).toHaveAttribute("title", "Workspaces");
    const expand = screen.getByRole("button", { name: "Expand sidebar" });
    expect(expand).toHaveAttribute("aria-expanded", "false");
    expect(expand).toHaveFocus();

    await user.click(expand);
    expect(sidebar).toHaveClass("w-64");
  });

  it("opens user account menu with person button, toggles details, and closes on Escape", async () => {
    const user = userEvent.setup();
    authSession.establish(
      {
        userId: "00000000-0000-0000-0000-000000000001",
        accessToken: "test.header.signature",
        expiresAt: Date.now() + 60_000,
      },
      authSession.begin(),
    );
    renderRoute(ROUTES.workspaces);
    const trigger = screen.getByRole("button", { name: "User account" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog", {
      name: "User account details",
    });
    expect(dialog).toBeVisible();

    const detailsButton = within(dialog).getByRole("button", {
      name: "My Profile",
    });
    await user.click(detailsButton);
    const detailsRegion = within(dialog).getByRole("region", {
      name: "My Profile details",
    });
    expect(detailsRegion).toBeVisible();
    expect(
      within(detailsRegion).getByText(/00000000-0000-0000-0000-000000000001/),
    ).toBeVisible();

    expect(
      within(dialog).getByRole("button", { name: "Sign out" }),
    ).toBeVisible();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
