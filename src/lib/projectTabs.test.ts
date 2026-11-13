import { describe, expect, it } from "vitest";
import {
  PROJECT_TABS,
  readProjectTab,
  projectTabSearch,
} from "@/lib/projectTabs";

describe("project tabs", () => {
  it.each(PROJECT_TABS)("round trips $label", ({ value }) => {
    expect(readProjectTab(new URLSearchParams(projectTabSearch(value)))).toBe(
      value,
    );
  });
  it.each(["", "tab=unknown", "tab=Overview", "section=team"])(
    "defaults safely for %s",
    (search) => {
      expect(readProjectTab(new URLSearchParams(search))).toBe("overview");
    },
  );
  it("omits the overview query", () => {
    expect(projectTabSearch("overview")).toBe("");
  });
});
