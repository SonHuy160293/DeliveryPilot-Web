import { describe, expect, it } from "vitest";
import {
  WORKSPACE_SECTIONS,
  readWorkspaceSection,
  workspaceSectionSearch,
} from "@/lib/workspaceSections";

describe("workspace sections", () => {
  it.each(WORKSPACE_SECTIONS)("round trips $label", ({ value }) => {
    expect(
      readWorkspaceSection(new URLSearchParams(workspaceSectionSearch(value))),
    ).toBe(value);
  });
  it.each(["", "section=unknown"])("defaults safely for %s", (search) => {
    expect(readWorkspaceSection(new URLSearchParams(search))).toBe("overview");
  });
});
