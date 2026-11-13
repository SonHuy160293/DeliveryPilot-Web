import { describe, expect, it } from "vitest";
import { computeReadiness } from "@/features/projects/model/readiness";
import { projectFixtures, participantFixtures } from "@/mocks/projects";
import {
  PROJECT_ROLE_LABELS,
  projectRoleLabel,
} from "@/features/projects/model/roleLabels";
import type { Participant } from "@/features/projects/api/types";
const byProject: Readonly<Record<string, readonly Participant[]>> =
  participantFixtures;
function fixture(index: number) {
  const item = projectFixtures[index];
  if (!item) throw new Error("Missing fixture");
  return item;
}
describe("project readiness and role labels", () => {
  it("returns every gap, including invalid cadence, instead of the first gap", () => {
    const { detail } = fixture(1);
    expect(
      computeReadiness(
        { ...detail, engagement: null, sprintLengthWeeks: null },
        { productGoal: null },
        [],
      ),
    ).toEqual([
      "ProductGoal",
      "SprintLength",
      "ProjectManager",
      "Engagement",
      "ClientProductOwnerWaiver",
    ]);
  });
  it("counts the Draft fixture's three missing steps and exempts Internal projects from client setup", () => {
    const draft = fixture(1);
    expect(
      computeReadiness(
        draft.detail,
        draft.brief,
        byProject[draft.detail.id] ?? [],
      ),
    ).toEqual(["ProductGoal", "ProjectManager", "ClientProductOwnerWaiver"]);
    expect(
      computeReadiness(
        { ...draft.detail, kind: "Internal" },
        { productGoal: "Written" },
        [],
      ),
    ).toEqual(["ProjectManager"]);
    expect(
      computeReadiness(
        { ...draft.detail, clientPoWaiverReason: "Approved waiver" },
        { productGoal: "Written" },
        [],
      ),
    ).toEqual(["ProjectManager"]);
  });
  it("requires active roles and an active assigned guest, and accepts a PM participant of either kind", () => {
    const first = fixture(0),
      people = byProject[first.detail.id] ?? [];
    expect(computeReadiness(first.detail, first.brief, people)).toEqual([]);
    expect(
      computeReadiness(
        first.detail,
        first.brief,
        people.map((item) => ({ ...item, status: "Removed" })),
      ),
    ).toEqual(["ProjectManager", "ClientProductOwnerWaiver"]);
    const guest = people.find((item) => item.kind === "Guest");
    if (!guest) throw new Error("Missing guest");
    expect(
      computeReadiness(first.detail, first.brief, [
        { ...guest, roles: ["ProjectManager"] },
      ]),
    ).toEqual([]);
  });
  it("renders every exact role label", () => {
    expect(Object.values(PROJECT_ROLE_LABELS)).toEqual([
      "Project admin",
      "PM",
      "BA",
      "Developer",
      "QA",
      "DevOps",
      "Viewer",
    ]);
    expect(projectRoleLabel("ProjectAdministrator")).toBe("Project admin");
  });
});
