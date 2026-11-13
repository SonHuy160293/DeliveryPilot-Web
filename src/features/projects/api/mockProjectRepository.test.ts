import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { mockEngagementRepository } from "@/features/engagements/api/mockEngagementRepository";
import {
  createProjectMock,
  firstProject,
  draftProject,
  internalProject,
  projectWorkspace as wid,
  projectPerson,
  orphanProject,
} from "@/test/fixtures/projectMock";
import { settleMock as run } from "@/test/fixtures/mockClock";
import { orphanedProjectFixtures } from "@/mocks/projects";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T04:00:00Z"));
  __resetMocks();
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
const internalRequest = {
  name: " New project ",
  purpose: " Improve delivery ",
  kind: "Internal",
  engagementId: null,
} as const;
describe("project access and creation", () => {
  it("lists only active member participations and derives each role from the participant", async () => {
    const repo = createProjectMock(),
      rows = await run(repo.listMine(wid));
    expect(rows.map((item) => item.id)).toEqual([
      firstProject.detail.id,
      draftProject.detail.id,
      internalProject.detail.id,
    ]);
    expect(rows[1]).toMatchObject({
      myRoles: ["ProjectAdministrator"],
      missingSetupCount: 3,
    });
    expect(rows[0]).not.toHaveProperty("missingSetupCount");
    expect(rows[2]?.myRoles).toEqual(["Viewer"]);
    __setMockPersona("u-mai");
    expect((await run(repo.listMine(wid))).map((item) => item.id)).toEqual([
      firstProject.detail.id,
    ]);
    await expect(
      run(repo.get(wid, draftProject.detail.id)),
    ).rejects.toMatchObject({ kind: "not-found" });
    await expect(
      run(repo.get(wid, orphanProject().detail.id)),
    ).rejects.toMatchObject({ kind: "not-found" });
    __setMockPersona("u-tomasz");
    expect(await run(repo.listMine(wid))).toEqual([]);
    await expect(
      run(repo.get(wid, firstProject.detail.id)),
    ).rejects.toMatchObject({ kind: "not-found" });
  });
  it("never treats a workspace role as creation authority", async () => {
    __setMockPersona("u-tomasz");
    await expect(
      run(
        createProjectMock().create(wid, internalRequest, crypto.randomUUID()),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
  });
  it("creates Draft Scrum defaults with a sole administrator, isolates workspaces, and replays idempotently", async () => {
    const repo = createProjectMock(),
      key = crypto.randomUUID(),
      created = await run(repo.create(wid, internalRequest, key));
    expect(created).toMatchObject({
      name: "New project",
      purpose: "Improve delivery",
      status: "Draft",
      sprintLengthWeeks: 2,
      myRoles: ["ProjectAdministrator"],
      clientProductOwner: null,
      version: 1,
      missingSetupCount: 2,
    });
    expect(
      (await run(repo.listParticipants(wid, created.id))).map(
        (item) => item.userId,
      ),
    ).toEqual([projectPerson("u-linh").id]);
    expect((await run(repo.create(wid, internalRequest, key))).id).toBe(
      created.id,
    );
    await expect(
      run(repo.create(wid, { ...internalRequest, name: "Different" }, key)),
    ).rejects.toMatchObject({ kind: "conflict" });
    await expect(
      run(repo.get(crypto.randomUUID(), created.id)),
    ).rejects.toMatchObject({ kind: "not-found" });
    const read = await run(repo.get(wid, created.id));
    read.name = "Changed clone";
    expect((await run(repo.get(wid, created.id))).name).toBe("New project");
  });
  it("rejects missing, Closed or invisible engagements and accepts a visible Active engagement", async () => {
    const repo = createProjectMock(),
      options = await run(repo.creationOptions(wid));
    expect(options.engagements).toHaveLength(2);
    const engagement = options.engagements[0];
    if (!engagement) throw new Error("Missing engagement");
    const request = {
      ...internalRequest,
      kind: "Client",
      engagementId: engagement.id,
    } as const;
    const created = await run(repo.create(wid, request, crypto.randomUUID()));
    expect(created.engagement?.id).toBe(engagement.id);
    await expect(
      run(
        repo.create(
          wid,
          { ...request, engagementId: null },
          crypto.randomUUID(),
        ),
      ),
    ).rejects.toMatchObject({ kind: "validation" });
    await expect(
      run(
        repo.create(
          wid,
          { ...request, engagementId: "019a3000-0000-7000-8000-000000000003" },
          crypto.randomUUID(),
        ),
      ),
    ).rejects.toMatchObject({
      kind: "validation",
      details: { code: "Project.EngagementClosed" },
    });
    await expect(
      run(
        repo.create(
          wid,
          { ...request, engagementId: crypto.randomUUID() },
          crypto.randomUUID(),
        ),
      ),
    ).rejects.toMatchObject({ kind: "not-found" });
  });
  it("rechecks the engagement at submission after an earlier options read", async () => {
    const repo = createProjectMock(),
      options = await run(repo.creationOptions(wid)),
      engagement = options.engagements[0];
    if (!engagement) throw new Error("Missing engagement");
    __setMockPersona("u-mai");
    const full = await run(mockEngagementRepository.get(wid, engagement.id));
    await run(
      mockEngagementRepository.close(wid, engagement.id, {
        expectedVersion: full.version,
        reason: "Complete",
      }),
    );
    await expect(
      run(
        repo.create(
          wid,
          { ...internalRequest, kind: "Client", engagementId: engagement.id },
          crypto.randomUUID(),
        ),
      ),
    ).rejects.toMatchObject({ kind: "validation" });
  });
  it("rejects stale settings and brief versions, preserves prior Product Goals and scopes history cursors", async () => {
    const repo = createProjectMock(),
      detail = await run(repo.get(wid, draftProject.detail.id)),
      brief = await run(repo.getBrief(wid, detail.id));
    const updated = await run(
      repo.updateBriefItem(wid, detail.id, {
        expectedVersion: brief.version,
        item: "ProductGoal",
        value: "First goal",
      }),
    );
    await expect(
      run(
        repo.updateBriefItem(wid, detail.id, {
          expectedVersion: brief.version,
          item: "ProductGoal",
          value: "Stale",
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
    const replaced = await run(
      repo.updateBriefItem(wid, detail.id, {
        expectedVersion: updated.version,
        item: "ProductGoal",
        value: "Second goal",
      }),
    );
    expect(replaced.previousProductGoals[0]?.value).toBe("First goal");
    await expect(
      run(repo.setSprintLength(wid, detail.id, 3, detail.version)),
    ).rejects.toMatchObject({ kind: "conflict" });
    const latest = await run(repo.get(wid, detail.id));
    expect(
      (await run(repo.setSprintLength(wid, detail.id, 3, latest.version)))
        .sprintLengthWeeks,
    ).toBe(3);
    const history = await run(repo.history(wid, detail.id, {}));
    expect(
      history.items.some((item) => item.eventType === "ProductGoalChanged"),
    ).toBe(true);
  });
  it("fails closed for injected identity failures, abort, reset and persona changes", async () => {
    const repo = createProjectMock();
    __setMockFailure("projects.identity", "server");
    await expect(run(repo.listMine(wid))).rejects.toMatchObject({
      kind: "server",
      details: { code: "Identity.Unavailable" },
    });
    __setMockFailure("projects.identity", null);
    const abort = new AbortController(),
      pending = repo.listMine(wid, abort.signal);
    abort.abort();
    await expect(run(pending)).rejects.toMatchObject({ kind: "cancelled" });
    const old = repo.listMine(wid);
    __setMockPersona("u-mai");
    await expect(run(old)).rejects.toMatchObject({ kind: "cancelled" });
    const reset = repo.listMine(wid);
    __resetMocks();
    await expect(run(reset)).rejects.toMatchObject({ kind: "cancelled" });
  });
});
describe("Owner-only recovery without content access", () => {
  it("appoints an existing active member candidate without joining the Owner", async () => {
    const repo = createProjectMock();
    await expect(run(repo.listOrphaned(wid))).rejects.toMatchObject({
      kind: "forbidden",
    });
    __setMockPersona("u-mai");
    expect(await run(repo.listOrphaned(wid))).toEqual(orphanedProjectFixtures);
    const orphan = orphanProject(),
      candidate = orphanedProjectFixtures[0]?.candidates[0];
    if (!candidate) throw new Error("Missing candidate");
    await run(
      repo.appointAdministrator(wid, orphan.detail.id, {
        participantId: candidate.participantId,
        reason: "Restore management",
      }),
    );
    expect(await run(repo.listOrphaned(wid))).toEqual([]);
    expect(
      (await run(repo.listMine(wid))).some(
        (item) => item.id === orphan.detail.id,
      ),
    ).toBe(false);
    await expect(run(repo.get(wid, orphan.detail.id))).rejects.toMatchObject({
      kind: "not-found",
    });
    await expect(
      run(
        repo.appointAdministrator(wid, orphan.detail.id, {
          participantId: candidate.participantId,
          reason: "Retry",
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
    __setMockPersona("u-arjun");
    expect((await run(repo.get(wid, orphan.detail.id))).myRoles).toEqual([
      "Developer",
      "ProjectAdministrator",
    ]);
  });
});
