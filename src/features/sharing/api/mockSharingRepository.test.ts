import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockSharingRepository } from "@/features/sharing/api/mockSharingRepository";
import { createMockShareStore } from "@/features/sharing/api/mockShareStore";
import {
  guestShare,
  shareEvent,
  shareableItem,
} from "@/features/sharing/api/contracts";
import { createMockProjectRepository } from "@/features/projects/api/mockProjectRepository";
import { guestShareFixtures, shareEventFixtures } from "@/mocks/portal";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import { projectEngagementAdapter } from "@/mocks/projectEngagementAdapter";
import {
  firstProject,
  internalProject,
  projectWorkspace as wid,
  projectPerson,
} from "@/test/fixtures/projectMock";
import { settleMock as run } from "@/test/fixtures/mockClock";
const id = firstProject.detail.id;
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
function setup() {
  const store = createMockShareStore(),
    projects = createMockProjectRepository(projectEngagementAdapter, store),
    fullRead = vi.fn().mockResolvedValue(true);
  const repository = createMockSharingRepository(
    {
      read: (workspaceId, projectId) =>
        projects.sharingSnapshot(workspaceId, projectId),
      canReadEngagement: fullRead,
    },
    store,
  );
  return { store, projects, fullRead, repository };
}
describe("sharing contracts and authorization", () => {
  it("parses every supplied share and history fixture and excludes Product Goal", () => {
    for (const row of guestShareFixtures)
      expect(guestShare.parse(row)).toEqual(row);
    for (const row of shareEventFixtures)
      expect(shareEvent.parse(row)).toEqual(row);
    expect(
      shareableItem.safeParse({
        itemType: "BriefItem",
        briefItemCode: "ProductGoal",
      }).success,
    ).toBe(false);
  });
  it.each(["u-mai", "u-linh"] as const)(
    "allows %s to share and withdraw with attributed history",
    async (persona) => {
      __setMockPersona(persona);
      const { repository } = setup(),
        row = await run(
          repository.share(wid, id, {
            itemType: "BriefItem",
            briefItemCode: "Assumptions",
          }),
        );
      expect(row.status).toBe("Shared");
      const withdrawn = await run(
        repository.withdraw(wid, id, row.id, {
          expectedVersion: row.version,
          reason: "Internal planning",
        }),
      );
      expect(withdrawn).toMatchObject({ status: "Withdrawn", version: 2 });
      const events = await run(repository.history(wid, id, {}));
      expect(events.items.slice(0, 2)).toMatchObject([
        {
          action: "Withdrawn",
          reason: "Internal planning",
          actorUserId: projectPerson(persona).id,
        },
        { action: "Shared", actorUserId: projectPerson(persona).id },
      ]);
    },
  );
  it.each(["u-sofia", "u-arjun", "u-hannah"] as const)(
    "allows member %s to read badges but denies management and history",
    async (persona) => {
      __setMockPersona(persona);
      const { repository } = setup();
      expect(await run(repository.list(wid, id))).toHaveLength(5);
      await expect(
        run(
          repository.share(wid, id, {
            itemType: "BriefItem",
            briefItemCode: "Assumptions",
          }),
        ),
      ).rejects.toMatchObject({ kind: "forbidden" });
      await expect(run(repository.history(wid, id, {}))).rejects.toMatchObject({
        kind: "forbidden",
      });
      await expect(
        run(
          repository.withdraw(wid, id, guestShareFixtures[0].id, {
            expectedVersion: 1,
            reason: null,
          }),
        ),
      ).rejects.toMatchObject({ kind: "forbidden" });
    },
  );
  it.each(["u-tomasz", "u-grace", "u-oskar"] as const)(
    "returns not-found to guest or nonparticipant %s",
    async (persona) => {
      __setMockPersona(persona);
      await expect(run(setup().repository.list(wid, id))).rejects.toMatchObject(
        { kind: "not-found" },
      );
    },
  );
  it("requires a Client engagement and full engagement visibility", async () => {
    const { repository, fullRead } = setup();
    fullRead.mockResolvedValue(false);
    await expect(
      run(repository.share(wid, id, { itemType: "EngagementSummary" })),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(
      run(
        repository.withdraw(wid, id, guestShareFixtures[3].id, {
          expectedVersion: 1,
          reason: null,
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    fullRead.mockResolvedValue(true);
    expect(
      await run(repository.share(wid, id, { itemType: "EngagementSummary" })),
    ).toMatchObject({
      status: "Shared",
      engagementId: firstProject.detail.engagement?.id,
    });
    __setMockPersona("u-daniel");
    await expect(
      run(
        repository.share(wid, internalProject.detail.id, {
          itemType: "EngagementSummary",
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
  });
});
describe("sharing state and history", () => {
  it("deduplicates concurrent first shares and records only the actual change", async () => {
    const { repository } = setup();
    const item = {
      itemType: "BriefItem",
      briefItemCode: "Assumptions",
    } as const;
    const results = await run(
      Promise.all([
        repository.share(wid, id, item),
        repository.share(wid, id, item),
      ]),
    );
    expect(results[0].id).toBe(results[1].id);
    expect(
      (await run(repository.list(wid, id))).filter(
        (row) => row.briefItemCode === "Assumptions",
      ),
    ).toHaveLength(1);
    expect((await run(repository.history(wid, id, {}))).items).toHaveLength(6);
  });
  it("withdraws a retired stakeholder in the same store and rejects resharing", async () => {
    const { repository, projects } = setup(),
      stakeholder = (await run(projects.listStakeholders(wid, id, false)))[0];
    if (!stakeholder) throw new Error("Missing stakeholder");
    await run(
      projects.retireStakeholder(wid, id, stakeholder.id, stakeholder.version),
    );
    expect(
      (await run(repository.list(wid, id))).find(
        (row) => row.stakeholderId === stakeholder.id,
      )?.status,
    ).toBe("Withdrawn");
    expect((await run(repository.history(wid, id, {}))).items[0]).toMatchObject(
      { action: "Withdrawn", itemLabel: stakeholder.name },
    );
    await expect(
      run(
        repository.share(wid, id, {
          itemType: "Stakeholder",
          stakeholderId: stakeholder.id,
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
  });
  it("serializes racing share/withdraw operations without duplicate rows and rejects a stale version", async () => {
    const { repository } = setup(),
      original = guestShareFixtures[0];
    await run(
      Promise.all([
        repository.withdraw(wid, id, original.id, {
          expectedVersion: 1,
          reason: "Review",
        }),
        repository.share(wid, id, {
          itemType: "BriefItem",
          briefItemCode: "Problem",
        }),
      ]),
    );
    const rows = (await run(repository.list(wid, id))).filter(
      (row) => row.briefItemCode === "Problem",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "Shared", version: 3 });
    await expect(
      run(
        repository.withdraw(wid, id, original.id, {
          expectedVersion: 1,
          reason: null,
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
    expect(
      (await run(repository.history(wid, id, {}))).items
        .slice(0, 2)
        .map((row) => row.action),
    ).toEqual(["Shared", "Withdrawn"]);
  });
  it("does not invent events for idempotent shares or withdrawals", async () => {
    const { repository } = setup(),
      row = await run(
        repository.share(wid, id, {
          itemType: "BriefItem",
          briefItemCode: "Problem",
        }),
      );
    expect((await run(repository.history(wid, id, {}))).items).toHaveLength(5);
    const withdrawn = await run(
      repository.withdraw(wid, id, row.id, {
        expectedVersion: row.version,
        reason: null,
      }),
    );
    await run(
      repository.withdraw(wid, id, row.id, {
        expectedVersion: withdrawn.version,
        reason: null,
      }),
    );
    expect((await run(repository.history(wid, id, {}))).items).toHaveLength(6);
  });
  it("pages history by 50 with scope-bound cursors and resets mock state", async () => {
    const { repository, store } = setup(),
      state = store.project(wid, id),
      sample = state.history[0];
    if (!sample) throw new Error("Missing event");
    state.history = Array.from({ length: 52 }, () => ({
      ...sample,
      id: crypto.randomUUID(),
    }));
    const first = await run(repository.history(wid, id, {})),
      next = await run(
        repository.history(wid, id, { cursor: first.nextCursor }),
      );
    expect(first.items).toHaveLength(50);
    expect(next.items).toHaveLength(2);
    await expect(
      run(
        repository.history(crypto.randomUUID(), id, {
          cursor: first.nextCursor,
        }),
      ),
    ).rejects.toBeDefined();
    __resetMocks();
    expect(await run(repository.list(wid, id))).toHaveLength(5);
  });
  it("never mutates returned fixture copies and cancels before committing", async () => {
    const { repository } = setup(),
      rows = await run(repository.list(wid, id));
    if (rows[0]) rows[0].status = "Withdrawn";
    expect((await run(repository.list(wid, id)))[0]?.status).toBe("Shared");
    const controller = new AbortController(),
      pending = repository.list(wid, id, controller.signal);
    controller.abort();
    await expect(run(pending)).rejects.toMatchObject({ kind: "cancelled" });
    const sharing = repository.share(wid, id, {
      itemType: "BriefItem",
      briefItemCode: "Assumptions",
    });
    __setMockPersona("u-arjun");
    await expect(run(sharing)).rejects.toMatchObject({ kind: "cancelled" });
  });
});
