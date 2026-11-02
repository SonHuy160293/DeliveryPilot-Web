import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ROUTES } from "@/lib/routes";
import { renderRoute } from "@/test/renderRoute";
import { homeSections, homeSectionHref } from "@/lib/homeNavigation";

describe("homepage evaluation journey", () => {
  it("explains the product and labels every product example honestly", () => {
    renderRoute(ROUTES.home);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Know what’s committed.",
    );
    expect(
      screen.getByText(/Software delivery management for engineering/),
    ).toBeVisible();
    expect(
      screen.getByText(
        /delivery workflows and account creation are not connected/,
      ),
    ).toBeVisible();
    expect(screen.getByRole("figure")).toHaveAccessibleName(
      /Concept illustration, not live product data/,
    );
    expect(screen.queryByText(/TODO\(copy\)/)).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("figure")).queryByRole("button"),
    ).not.toBeInTheDocument();
  });

  it("keeps work, QA, client acceptance and release separate in the example", () => {
    renderRoute(ROUTES.home);
    const figure = within(screen.getByRole("figure"));
    expect(figure.getByText("Work done")).toBeVisible();
    expect(figure.getByText("Evidence pending")).toBeVisible();
    expect(figure.getByText("Review pending")).toBeVisible();
    expect(figure.getByText("Not released")).toBeVisible();
  });

  it("links each section navigation item to an existing focusable section", () => {
    renderRoute(ROUTES.home);
    const nav = within(
      screen.getByRole("navigation", { name: "Homepage sections" }),
    );
    for (const section of homeSections) {
      expect(nav.getByRole("link", { name: section.label })).toHaveAttribute(
        "href",
        homeSectionHref(section.id),
      );
      expect(document.getElementById(section.id)).toHaveAttribute(
        "tabindex",
        "-1",
      );
    }
  });

  it("shows a proposed revision separately from its illustrative approved baseline", () => {
    renderRoute(ROUTES.home);
    const capabilities = within(
      screen.getByRole("region", { name: /Less reconstruction/ }),
    );
    expect(capabilities.getByText("Approved baseline")).toBeVisible();
    expect(capabilities.getByText("Proposed revision")).toBeVisible();
    expect(capabilities.getByText("Version 3 · Proposed")).toBeVisible();
    expect(
      capabilities.getByText("Version 2 remains the baseline."),
    ).toBeVisible();
  });

  it("opens and closes the mobile menu with keyboard and returns focus on Escape", async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.home);
    const trigger = screen.getByRole("button", { name: "Menu" });
    trigger.focus();
    await user.keyboard("{Enter}");
    expect(
      screen.getByRole("dialog", { name: "Explore DeliveryPilot" }),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes the mobile menu when a section is selected", async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.home);
    await user.click(screen.getByRole("button", { name: "Menu" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("link", {
        name: "Capabilities",
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("routes the dominant hero action to the connected registration form", async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.home);
    const hero = within(
      screen.getByRole("region", { name: /Know what’s committed/ }),
    );
    await user.click(hero.getByRole("link", { name: "Get started" }));
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Create an account",
      }),
    ).toBeVisible();
    expect(
      screen.getByText("Create your account, then sign in to continue."),
    ).toBeVisible();
  });

  it("routes interface exploration to sign-in", async () => {
    const user = userEvent.setup();
    renderRoute(ROUTES.home);
    const hero = within(
      screen.getByRole("region", { name: /Know what’s committed/ }),
    );
    await user.click(hero.getByRole("link", { name: "Explore the preview" }));
    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  it("omits section navigation when a preview state replaces the sections", () => {
    renderRoute(`${ROUTES.home}?state=no-permission`);
    expect(
      screen.queryByRole("navigation", { name: "Homepage sections" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("figure")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Access unavailable");
  });
});
