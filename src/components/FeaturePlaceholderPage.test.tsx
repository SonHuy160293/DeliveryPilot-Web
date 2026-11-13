import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { FeaturePlaceholderPage } from "@/components/FeaturePlaceholderPage";
import type { PreviewState } from "@/components/ScreenState";

// Presentation coverage only: these placeholders have no repository or write outcomes.
function renderPlaceholder(state: PreviewState) {
  return render(
    <MemoryRouter>
      <FeaturePlaceholderPage
        title="Project"
        breadcrumbs={[{ label: "Project" }]}
        state={state}
      />
    </MemoryRouter>,
  );
}

describe("unconnected placeholder presentations", () => {
  it("renders explicit future-feature copy", () => {
    renderPlaceholder("ready");
    expect(
      screen.getByRole("heading", { level: 1, name: "Project" }),
    ).toBeVisible();
    expect(screen.getByText("A URL does not grant access.")).toBeVisible();
  });
  it("announces loading", () => {
    renderPlaceholder("loading");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading project.")).toBeInTheDocument();
  });
  it("offers a safe next step when empty", () => {
    renderPlaceholder("empty");
    expect(
      screen.getByRole("heading", { name: "Nothing to show yet" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Back to workspaces" }),
    ).toBeVisible();
  });
  it("does not claim a request failed", () => {
    renderPlaceholder("error");
    expect(screen.getByRole("alert")).toHaveTextContent("No request was sent");
  });
  it("never presents preview success as a saved operation", () => {
    renderPlaceholder("success");
    expect(screen.getByRole("status")).toHaveTextContent("No change was saved");
  });
  it("does not imply real permission checks", () => {
    renderPlaceholder("no-permission");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Real access checks are not connected",
    );
  });
});
