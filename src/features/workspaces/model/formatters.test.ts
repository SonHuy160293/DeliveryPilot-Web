import { expect, it } from "vitest";
import {
  formatInstant,
  formatNumber,
  formatStatus,
} from "@/features/workspaces/model/formatters";

it("preserves the workspace formatter exports through the shared implementation", () => {
  const instant = new Date(2026, 10, 2, 14, 5).toISOString();
  expect(formatInstant(instant)).toBe("2 Nov 2026, 14:05");
  expect(formatNumber(4200)).toBe("4,200");
  expect(formatStatus("pending")).toBe("Pending");
});
