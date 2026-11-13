import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { MockDataBanner } from "@/components/MockDataBanner";

it("announces the exact sample-data boundary", () => {
  render(<MockDataBanner />);
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Sample data. This page is not connected to the server yet; changes are kept only until you reload.",
  );
  expect(screen.getByRole("alert")).toHaveClass(
    "bg-callout",
    "border-callout-border",
  );
});
