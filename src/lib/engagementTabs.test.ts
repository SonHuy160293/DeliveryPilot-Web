import { describe, expect, it } from "vitest";
import {
  ENGAGEMENT_TABS,
  readEngagementTab,
  engagementTabSearch,
} from "@/lib/engagementTabs";

describe("engagement tabs", () => {
  it.each(ENGAGEMENT_TABS)("round trips $label", ({ value }) => {
    expect(
      readEngagementTab(new URLSearchParams(engagementTabSearch(value))),
    ).toBe(value);
  });
  it.each(["", "tab=unknown", "tab=Details", "section=contract"])(
    "defaults safely for %s",
    (search) => {
      expect(readEngagementTab(new URLSearchParams(search))).toBe("details");
    },
  );
  it("omits the details query", () => {
    expect(engagementTabSearch("details")).toBe("");
  });
});
