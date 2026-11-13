import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ReasonField } from "@/components/ReasonField";

describe("reason fields", () => {
  it("labels the required reason and counts characters", async () => {
    render(<ReasonField required />);
    const input = screen.getByRole("textbox", { name: "Reason" });
    expect(input).toBeRequired();
    expect(input).toHaveAttribute("maxlength", "2000");
    await userEvent.type(input, "Review scope");
    expect(screen.getByText("12 / 2,000")).toBeVisible();
    expect(input).toHaveAccessibleDescription("12 / 2,000");
  });
  it("labels optional input and associates its error", () => {
    render(<ReasonField required={false} error="Enter a reason." />);
    const input = screen.getByLabelText("Reason (optional)");
    expect(input).not.toBeRequired();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("0 / 2,000 Enter a reason.");
  });
  it("counts a controlled initial value", () => {
    render(<ReasonField required value="Review" readOnly />);
    expect(screen.getByText("6 / 2,000")).toBeVisible();
  });
});
