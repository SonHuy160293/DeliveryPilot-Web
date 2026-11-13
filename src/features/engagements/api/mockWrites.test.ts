import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockEngagementRepository } from "@/features/engagements/api/mockEngagementRepository";
import type { EngagementRepository } from "@/features/engagements/api/engagementRepository";
import type {
  EngagementDetail,
  EngagementMilestone,
} from "@/features/engagements/api/types";
import { engagementFixtures } from "@/mocks/engagements";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { settleMock as run } from "@/test/fixtures/mockClock";
const workspaceId = "019a1000-0000-7000-8000-000000000001";
function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing fixture");
  return value;
}
const row = required(engagementFixtures.items[0]);
const milestone = required(row.milestones[1]);
const terminal = required(row.milestones[0]);
const amount = {
  expectedVersion: row.version,
  contractAmount: 200000,
  contractCurrency: "AUD",
  plannedEffortPersonDays: 450,
  reason: null,
};
const operations = [
  "setContractValue",
  "close",
  "reopen",
  "addMilestone",
  "editMilestone",
  "changeMilestoneDate",
  "changeMilestoneStatus",
] as const;
async function write(
  repo: EngagementRepository,
  action: (typeof operations)[number],
  version = row.version,
): Promise<EngagementDetail | EngagementMilestone> {
  switch (action) {
    case "setContractValue":
      return repo.setContractValue(workspaceId, row.id, {
        ...amount,
        expectedVersion: version,
      });
    case "close":
    case "reopen":
      return repo[action](workspaceId, row.id, {
        expectedVersion: version,
        reason: "Agreed change",
      });
    case "addMilestone":
      return repo.addMilestone(workspaceId, row.id, {
        expectedVersion: version,
        name: "New milestone",
        description: null,
        targetDate: "2027-04-01",
      });
    case "editMilestone":
      return repo.editMilestone(workspaceId, row.id, milestone.id, {
        expectedVersion: version,
        name: "Updated milestone",
        description: null,
      });
    case "changeMilestoneDate":
      return repo.changeMilestoneDate(workspaceId, row.id, milestone.id, {
        expectedVersion: version,
        targetDate: "2027-02-01",
        reason: "Agreed date",
      });
    case "changeMilestoneStatus":
      return repo.changeMilestoneStatus(workspaceId, row.id, milestone.id, {
        expectedVersion: version,
        status: "Achieved",
        reason: null,
      });
  }
}
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
  __setMockPersona("u-mai");
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
describe("engagement write invariants", () => {
  it.each(operations)(
    "%s rejects a read-all persona and a stale expectedVersion",
    async (action) => {
      const repo = createMockEngagementRepository();
      __setMockPersona("u-linh");
      await expect(run(write(repo, action))).rejects.toMatchObject({
        kind: "forbidden",
      });
      __setMockPersona("u-mai");
      await expect(run(write(repo, action, 100))).rejects.toMatchObject({
        kind: "conflict",
      });
    },
  );
  it.each(operations.filter((action) => action !== "reopen"))(
    "%s cannot mutate a Closed engagement",
    async (action) => {
      const repo = createMockEngagementRepository();
      const closed = await run(
        repo.close(workspaceId, row.id, {
          expectedVersion: row.version,
          reason: "Complete",
        }),
      );
      await expect(
        run(
          write(
            repo,
            action,
            action.includes("Milestone") && action !== "addMilestone"
              ? milestone.version
              : closed.version,
          ),
        ),
      ).rejects.toMatchObject({ kind: "conflict" });
    },
  );
  it("allows clearing the amount/currency pair before changing currency, while preserving unrecorded nulls", async () => {
    const repo = createMockEngagementRepository();
    await expect(
      run(
        repo.setContractValue(workspaceId, row.id, {
          ...amount,
          contractCurrency: "USD",
        }),
      ),
    ).rejects.toMatchObject({ kind: "validation" });
    const cleared = await run(
      repo.setContractValue(workspaceId, row.id, {
        ...amount,
        contractAmount: null,
        contractCurrency: null,
        plannedEffortPersonDays: null,
      }),
    );
    expect(cleared).toMatchObject({
      contractAmount: null,
      contractCurrency: null,
      plannedEffortPersonDays: null,
    });
    const changed = await run(
      repo.setContractValue(workspaceId, row.id, {
        ...amount,
        expectedVersion: cleared.version,
        contractAmount: 0,
        contractCurrency: "USD",
      }),
    );
    expect(changed.contractAmount).toBe(0);
    expect(changed.contractCurrency).toBe("USD");
    const history = await run(repo.history(workspaceId, row.id, {}));
    expect(history.items[0]?.details).toMatchObject({
      previousContractAmount: null,
      newContractAmount: 0,
      newContractCurrency: "USD",
    });
  });
  it("validates reasons, milestone lengths and dates before writing", async () => {
    const repo = createMockEngagementRepository();
    await expect(
      run(
        repo.close(workspaceId, row.id, {
          expectedVersion: row.version,
          reason: " ",
        }),
      ),
    ).rejects.toMatchObject({ kind: "validation" });
    for (const input of [
      { name: "N".repeat(201), description: null, targetDate: "2027-01-01" },
      { name: "Name", description: "D".repeat(2001), targetDate: "2027-01-01" },
      { name: "Name", description: null, targetDate: "2027-02-30" },
    ])
      await expect(
        run(
          repo.addMilestone(workspaceId, row.id, {
            expectedVersion: row.version,
            ...input,
          }),
        ),
      ).rejects.toMatchObject({ kind: "validation" });
  });
  it("refuses edit/date/status actions on Achieved and Retired milestones", async () => {
    const repo = createMockEngagementRepository();
    const retired = await run(
      repo.changeMilestoneStatus(workspaceId, row.id, milestone.id, {
        expectedVersion: milestone.version,
        status: "Retired",
        reason: null,
      }),
    );
    for (const item of [terminal, retired]) {
      await expect(
        run(
          repo.editMilestone(workspaceId, row.id, item.id, {
            expectedVersion: item.version,
            name: "Changed",
            description: null,
          }),
        ),
      ).rejects.toMatchObject({ kind: "conflict" });
      await expect(
        run(
          repo.changeMilestoneDate(workspaceId, row.id, item.id, {
            expectedVersion: item.version,
            targetDate: "2028-01-01",
            reason: "Changed",
          }),
        ),
      ).rejects.toMatchObject({ kind: "conflict" });
      await expect(
        run(
          repo.changeMilestoneStatus(workspaceId, row.id, item.id, {
            expectedVersion: item.version,
            status: "Missed",
            reason: null,
          }),
        ),
      ).rejects.toMatchObject({ kind: "conflict" });
    }
  });
  it("allows only the five specified milestone transitions", async () => {
    for (const status of ["Achieved", "Missed", "Retired"] as const) {
      const repo = createMockEngagementRepository();
      const changed = await run(
        repo.changeMilestoneStatus(workspaceId, row.id, milestone.id, {
          expectedVersion: milestone.version,
          status,
          reason: null,
        }),
      );
      expect(changed.status).toBe(status);
    }
    for (const status of ["Achieved", "Retired"] as const) {
      const repo = createMockEngagementRepository();
      const missed = await run(
        repo.changeMilestoneStatus(workspaceId, row.id, milestone.id, {
          expectedVersion: milestone.version,
          status: "Missed",
          reason: null,
        }),
      );
      await expect(
        run(
          repo.changeMilestoneStatus(workspaceId, row.id, milestone.id, {
            expectedVersion: missed.version,
            status: "Missed",
            reason: null,
          }),
        ),
      ).rejects.toMatchObject({ kind: "conflict" });
      expect(
        (
          await run(
            repo.changeMilestoneStatus(workspaceId, row.id, milestone.id, {
              expectedVersion: missed.version,
              status,
              reason: null,
            }),
          )
        ).status,
      ).toBe(status);
    }
  });
  it("adds version one milestones and records attributed, paged history with original dates intact", async () => {
    const repo = createMockEngagementRepository();
    const added = await run(
      repo.addMilestone(workspaceId, row.id, {
        expectedVersion: row.version,
        name: "Final delivery",
        description: null,
        targetDate: "2027-05-01",
      }),
    );
    expect(added.version).toBe(1);
    const edited = await run(
      repo.editMilestone(workspaceId, row.id, added.id, {
        expectedVersion: added.version,
        name: "Handover",
        description: "Handover plan",
      }),
    );
    await run(
      repo.changeMilestoneDate(workspaceId, row.id, edited.id, {
        expectedVersion: edited.version,
        targetDate: "2027-06-01",
        reason: "Approved plan",
      }),
    );
    const history = await run(repo.history(workspaceId, row.id, { limit: 1 }));
    expect(history.items[0]).toMatchObject({
      eventType: "MilestoneDateChanged",
      subjectId: added.id,
      actorUserId: added.createdByUserId,
      reason: "Approved plan",
      details: {
        previousTargetDate: "2027-05-01",
        newTargetDate: "2027-06-01",
      },
    });
    expect(history.nextCursor).not.toBeNull();
    const latest = await run(repo.get(workspaceId, row.id));
    expect(latest.milestones.at(-1)?.originalTargetDate).toBe("2027-05-01");
    expect(latest.version).toBe(row.version + 3);
  });
  it("injects failures before a mutation and never reports a write that did not happen", async () => {
    const repo = createMockEngagementRepository();
    __setMockFailure("engagements.close", "server");
    await expect(run(write(repo, "close"))).rejects.toMatchObject({
      kind: "server",
    });
    expect((await run(repo.get(workspaceId, row.id))).version).toBe(
      row.version,
    );
  });
});
