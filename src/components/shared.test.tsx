import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  it("defaults to light and persists only the manual theme choice across remounts", async () => {
    const user = userEvent.setup();
    const first = render(<ThemeToggle />);
    expect(document.documentElement).not.toHaveClass("dark");
    screen.getByRole("button", { name: "Switch to dark mode" }).focus();
    await user.keyboard("{Enter}");
    expect(document.documentElement).toHaveClass("dark");
    expect(Object.keys(localStorage)).toEqual(["deliverypilot-theme"]);
    first.unmount();
    render(<ThemeToggle />);
    expect(
      screen.getByRole("button", { name: "Switch to light mode" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Switch to light mode" }),
    );
    expect(localStorage.getItem("deliverypilot-theme")).toBe("light");
  });

  it("keeps the theme usable when storage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Unavailable");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Unavailable");
    });
    const user = userEvent.setup();
    render(<ThemeToggle />);
    await user.click(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    );
    expect(document.documentElement).toHaveClass("dark");
  });

  it("opens mobile navigation with keyboard, traps focus and closes on navigation", async () => {
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
    const trigger = screen.getByRole("button", { name: "Menu" });
    trigger.focus();
    await user.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog", {
      name: "DeliveryPilot navigation",
    });
    await user.tab();
    expect(dialog).toContainElement(
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null,
    );
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    await user.keyboard("{Enter}");
    const links = screen.getAllByRole("link", { name: "Workspaces" });
    const navLink = links.find((link) =>
      screen.getByRole("dialog").contains(link),
    );
    if (!navLink) throw new Error("Expected the sheet navigation link");
    await user.click(navLink);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Workspaces" }),
    ).toBeVisible();
  });
});
