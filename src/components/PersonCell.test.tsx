import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PersonCell } from "@/components/PersonCell";

describe("person cells", () => {
  it("shows the name and optional secondary text with decorative initials", () => {
    render(
      <PersonCell userId="one" displayName="Test Person" secondary="Guest" />,
    );
    expect(screen.getByText("Test Person")).toBeVisible();
    expect(screen.getByText("Guest")).toBeVisible();
    expect(screen.getByText("TP")).toHaveAttribute("aria-hidden", "true");
  });
  it("keeps the avatar color stable for a user across name updates", () => {
    const { rerender } = render(
      <PersonCell userId="same-user" displayName="First Name" />,
    );
    const classes = screen.getByText("FN").className;
    rerender(<PersonCell userId="same-user" displayName="Different Name" />);
    expect(screen.getByText("DN")).toHaveClass(classes);
  });
  it("supports non-Latin and one-word names", () => {
    render(<PersonCell userId="unicode" displayName="林" />);
    expect(screen.getAllByText("林")).toHaveLength(2);
  });
  it("shows the specified fallback when lookup fails", () => {
    render(<PersonCell userId="unresolved" displayName={null} />);
    expect(screen.getByText("Name unavailable")).toHaveClass(
      "text-muted-foreground",
    );
  });
});
