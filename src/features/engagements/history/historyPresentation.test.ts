import { describe, expect, it } from "vitest";
import {
  engagementEventLabel,
  historyChanges,
} from "@/features/engagements/history/historyPresentation";
describe("safe engagement history presentation", () => {
  it("maps known events and uses the specified fallback", () => {
    expect(engagementEventLabel("EngagementCreated")).toBe(
      "Engagement created",
    );
    expect(engagementEventLabel("ContractValueChanged")).toBe(
      "Contract value changed",
    );
    expect(engagementEventLabel("MilestoneDateChanged")).toBe(
      "Milestone date changed",
    );
    expect(engagementEventLabel("EngagementClosed")).toBe("Engagement closed");
    expect(engagementEventLabel("unknown")).toBe("Engagement updated");
  });
  it("renders only known pairs and rejects malformed detail values", () => {
    expect(
      historyChanges({
        token: "secret",
        previousCode: "secret",
        newCode: "secret",
      }),
    ).toEqual([]);
    expect(
      historyChanges({
        previousStatus: { private: true },
        newStatus: "Achieved",
        previousTargetDate: "invalid",
        newTargetDate: "2027-01-12",
      }),
    ).toEqual([
      { label: "Target date", previous: "Not recorded", next: "12 Jan 2027" },
      { label: "Status", previous: "Not recorded", next: "Achieved" },
    ]);
  });
});
