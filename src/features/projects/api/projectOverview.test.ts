import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  createProjectMock,
  firstProject,
  internalProject,
  projectWorkspace as wid,
} from "@/test/fixtures/projectMock";
import { settleMock as run } from "@/test/fixtures/mockClock";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import { projectEngagementAdapter } from "@/mocks/projectEngagementAdapter";
import { projectOverviewContext } from "@/features/projects/api/contracts";
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
describe("participant-authorized overview context", () => {
  it("returns a money-free projection for a participant without full engagement access", async () => {
    __setMockPersona("u-sofia");
    const data = await run(
      createProjectMock().overviewContext(wid, firstProject.detail.id),
    );
    expect(data.engagement?.canOpenFullDetail).toBe(false);
    expect(data.engagement?.summary.milestones).toHaveLength(4);
    expect(Object.keys(data.engagement?.summary ?? {}).sort()).toEqual([
      "agreementReference",
      "clientDisplayName",
      "engagementId",
      "engagementName",
      "milestones",
      "status",
    ]);
    const json = JSON.stringify(data.engagement);
    expect(json).not.toMatch(
      /contractAmount|contractCurrency|plannedEffort|contacts|primaryEmail/,
    );
    expect(
      data.people[
        firstProject.brief.previousProductGoals[0]?.replacedByUserId ?? ""
      ],
    ).toBe("Linh Pham");
  });
  it("allows the full-detail link only for an authorized engagement reader", async () => {
    const data = await run(
      createProjectMock().overviewContext(wid, firstProject.detail.id),
    );
    expect(data.engagement?.canOpenFullDetail).toBe(true);
    expect(
      await run(
        createProjectMock().overviewContext(wid, internalProject.detail.id),
      ),
    ).toMatchObject({ engagement: null });
  });
  it("denies non-participating Owners and guests before invoking the summary bridge", async () => {
    const summary = vi.spyOn(projectEngagementAdapter, "getSummary"),
      repo = createProjectMock();
    __setMockPersona("u-tomasz");
    await expect(
      run(repo.overviewContext(wid, firstProject.detail.id)),
    ).rejects.toMatchObject({ kind: "not-found" });
    __setMockPersona("u-mai");
    await expect(
      run(repo.overviewContext(wid, internalProject.detail.id)),
    ).rejects.toMatchObject({ kind: "not-found" });
    expect(summary).not.toHaveBeenCalled();
  });
  it("strips accidental private fields from an adapter result at the project boundary", async () => {
    const repo = createProjectMock(),
      context = await run(repo.overviewContext(wid, firstProject.detail.id));
    if (!context.engagement) throw new Error("Missing summary");
    const parsed = projectOverviewContext.parse({
      ...context,
      engagement: {
        ...context.engagement,
        summary: {
          ...context.engagement.summary,
          contractAmount: 185000,
          contacts: ["private"],
        },
      },
    });
    expect(JSON.stringify(parsed)).not.toMatch(
      /contractAmount|contacts|private/,
    );
  });
});
