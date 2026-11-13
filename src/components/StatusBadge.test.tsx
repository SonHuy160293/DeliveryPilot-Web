import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/StatusBadge";
import { statusTone } from "@/lib/statusTone";

describe("status badges", () => {
  it.each([
    ["Active", "default"],
    ["Closed", "ghost"],
    ["Draft", "secondary"],
    ["Planned", "secondary"],
    ["Achieved", "default"],
    ["Missed", "outline"],
    ["Retired", "ghost"],
    ["Pending", "secondary"],
    ["Accepted", "default"],
    ["Declined", "ghost"],
    ["Cancelled", "ghost"],
    ["Expired", "outline"],
    ["Removed", "ghost"],
    ["Revoked", "ghost"],
    ["Left", "ghost"],
    ["Shared", "default"],
    ["Internal", "secondary"],
    ["Withdrawn", "ghost"],
    ["Link code outstanding", "outline"],
    ["No active administrator", "outline"],
  ])("renders %s as text with its specified variant", (label, variant) => {
    render(<StatusBadge label={label} tone={statusTone(label)} />);
    expect(screen.getByText(label)).toHaveAttribute("data-variant", variant);
    expect(screen.getByText(label)).not.toHaveAttribute("aria-hidden");
  });
  it("defaults unknown status mappings to neutral", () => {
    expect(statusTone("Future status")).toBe("neutral");
  });
});
