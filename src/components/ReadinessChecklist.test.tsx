import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReadinessChecklist } from "@/components/ReadinessChecklist";

describe("readiness checklists", () => {
  it("uses a semantic list with explicit Done and Missing text", () => {
    render(
      <ReadinessChecklist
        items={[
          { id: "ready", label: "Recorded item", done: true },
          { id: "missing", label: "Required item", done: false },
        ]}
      />,
    );
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Recorded itemDone");
    expect(items[1]).toHaveTextContent("Required itemMissing");
    expect(screen.getByText("Done")).toBeVisible();
    expect(screen.getByText("Missing")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the approved icons decoratively", () => {
    const { container } = render(
      <ReadinessChecklist
        items={[
          { id: "ready", label: "Recorded item", done: true },
          { id: "missing", label: "Required item", done: false },
        ]}
      />,
    );
    const icons = container.querySelectorAll("svg");
    expect(icons).toHaveLength(2);
    for (const icon of icons)
      expect(icon).toHaveAttribute("aria-hidden", "true");
    expect(icons[0]).toHaveClass("lucide-check-circle-2");
    expect(icons[1]).toHaveClass("lucide-circle");
  });

  it("renders optional hints and reflects updated outcomes", () => {
    const { rerender } = render(
      <ReadinessChecklist
        items={[
          {
            id: "item",
            label: "Required item",
            done: false,
            hint: "Complete this item before continuing.",
          },
        ]}
      />,
    );
    expect(
      screen.getByText("Complete this item before continuing."),
    ).toBeVisible();
    rerender(
      <ReadinessChecklist
        items={[{ id: "item", label: "Required item", done: true }]}
      />,
    );
    expect(screen.getByText("Done")).toBeVisible();
    expect(screen.queryByText("Missing")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Complete this item before continuing."),
    ).not.toBeInTheDocument();
  });

  it("keeps an empty checklist free of invented readiness claims", () => {
    render(<ReadinessChecklist items={[]} />);
    expect(screen.getByRole("list")).toBeEmptyDOMElement();
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });
});
