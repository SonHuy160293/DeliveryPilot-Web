import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMockEngagementRepository } from "@/features/engagements/api/mockEngagementRepository";
import {
  __resetMocks,
  __setMockPersona,
  __setMockFailure,
} from "@/mocks/mockRuntime";
import { engagementFixtures } from "@/mocks/engagements";
import { MOCK_PEOPLE } from "@/mocks/people";
import { settleMock as run } from "@/test/fixtures/mockClock";

const workspaceId = "019a1000-0000-7000-8000-000000000099";
const first = engagementFixtures.items[0];
if (!first) throw new Error("Missing first fixture");
const input = {
  clientDisplayName: "Test client",
  agreementReference: "TEST",
  agreementSignedOn: "2026-11-02",
};
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});

describe("mock engagement access and paging", () => {
  it("loads authorized history in one 400 ms call and masks denied history", async () => {
    const repo = createMockEngagementRepository();
    const pending = repo.history(workspaceId, first.id, { limit: 2 });
    await vi.advanceTimersByTimeAsync(400);
    const history = await pending;
    expect(history.items).toHaveLength(2);
    expect(history.nextCursor).not.toBeNull();
    const next = await run(
      repo.history(workspaceId, first.id, {
        limit: 2,
        cursor: history.nextCursor,
      }),
    );
    expect(next.items[0]?.id).not.toBe(history.items[0]?.id);
    __setMockPersona("u-sofia");
    await expect(
      run(repo.history(workspaceId, first.id, {})),
    ).rejects.toMatchObject({ kind: "not-found" });
  });
  it.each(["u-mai", "u-daniel", "u-linh"] as const)(
    "lets the code-bearing persona %s read full details",
    async (key) => {
      __setMockPersona(key);
      const repo = createMockEngagementRepository();
      const page = await run(repo.list(workspaceId, {}));
      expect(page.items).toHaveLength(3);
      expect(
        page.items.every((row) => row.organizationId === workspaceId),
      ).toBe(true);
      expect(await run(repo.get(workspaceId, first.id))).toMatchObject({
        id: first.id,
        organizationId: workspaceId,
      });
    },
  );
  it("returns an empty list without grants and masks unknown/denied detail identically", async () => {
    __setMockPersona("u-sofia");
    const repo = createMockEngagementRepository();
    expect((await run(repo.list(workspaceId, {}))).items).toEqual([]);
    await expect(
      run(repo.create(workspaceId, input, crypto.randomUUID())),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(run(repo.get(workspaceId, first.id))).rejects.toMatchObject({
      kind: "not-found",
      message:
        "This engagement isn't available. It may not exist, or you may not have access.",
    });
    await expect(
      run(repo.get(workspaceId, crypto.randomUUID())),
    ).rejects.toMatchObject({
      kind: "not-found",
      message:
        "This engagement isn't available. It may not exist, or you may not have access.",
    });
  });
  it("filters status and scopes cursors to the result set", async () => {
    const repo = createMockEngagementRepository();
    const active = await run(
      repo.list(workspaceId, { status: "Active", limit: 1 }),
    );
    expect(active.items).toHaveLength(1);
    expect(active.nextCursor).not.toBeNull();
    const next = await run(
      repo.list(workspaceId, {
        status: "Active",
        limit: 1,
        cursor: active.nextCursor,
      }),
    );
    expect(next.items[0]?.id).not.toBe(active.items[0]?.id);
    expect(next.nextCursor).toBeNull();
    await expect(
      run(
        repo.list(workspaceId, { status: "Closed", cursor: active.nextCursor }),
      ),
    ).rejects.toMatchObject({ kind: "bad-request" });
    expect(
      (await run(repo.list(workspaceId, { status: "Closed" }))).items,
    ).toHaveLength(1);
  });
  it("uses page size 50 and never leaks fixture changes between workspaces or callers", async () => {
    const repo = createMockEngagementRepository();
    await run(
      Promise.all(
        Array.from({ length: 51 }, (_, index) =>
          repo.create(
            workspaceId,
            { ...input, agreementReference: `TEST-${String(index)}` },
            crypto.randomUUID(),
          ),
        ),
      ),
    );
    const one = await run(repo.list(workspaceId, { status: "Active" }));
    expect(one.items).toHaveLength(50);
    expect(
      (
        await run(
          repo.list(workspaceId, { status: "Active", cursor: one.nextCursor }),
        )
      ).items,
    ).toHaveLength(3);
    const row = one.items[0];
    if (row) row.clientDisplayName = "Changed outside repository";
    expect((await run(repo.get(workspaceId, first.id))).clientDisplayName).toBe(
      first.clientDisplayName,
    );
    expect((await run(repo.list(first.organizationId, {}))).items).toHaveLength(
      3,
    );
  });
  it("honors cancellation and the test-only reset/failure controls", async () => {
    const repo = createMockEngagementRepository();
    const controller = new AbortController();
    const request = repo.list(workspaceId, {}, controller.signal);
    controller.abort();
    await expect(run(request)).rejects.toMatchObject({ kind: "cancelled" });
    __setMockFailure("engagements.list", "server");
    await expect(run(repo.list(workspaceId, {}))).rejects.toMatchObject({
      kind: "server",
    });
    __resetMocks();
    expect((await run(repo.list(workspaceId, {}))).items).toHaveLength(3);
  });
});
describe("mock engagement writes", () => {
  it("creates once per idempotency key, reports duplicates and records fixture creator attribution", async () => {
    const repo = createMockEngagementRepository();
    const key = crypto.randomUUID();
    const request = { ...input, agreementReference: first.agreementReference };
    const result = await run(repo.create(workspaceId, request, key));
    expect(result.snapshot).toMatchObject({
      status: "Active",
      duplicateAgreementReference: true,
      version: 1,
    });
    const replay = await run(repo.create(workspaceId, request, key));
    expect(replay).toEqual({ ...result, isReplay: true });
    const created = await run(repo.get(workspaceId, result.snapshot.id));
    expect(created.createdByUserId).toBe(
      MOCK_PEOPLE.find((person) => person.key === "u-linh")?.id,
    );
    expect((await run(repo.list(workspaceId, {}))).items).toHaveLength(4);
    await expect(
      run(
        repo.create(
          workspaceId,
          { ...request, clientDisplayName: "Changed" },
          key,
        ),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
  });
  it("rejects invalid create fields with 422 field errors", async () => {
    const repo = createMockEngagementRepository();
    await expect(
      run(
        repo.create(
          workspaceId,
          { ...input, clientDisplayName: "N".repeat(201) },
          crypto.randomUUID(),
        ),
      ),
    ).rejects.toMatchObject({
      kind: "validation",
      details: {
        fieldErrors: { clientDisplayName: ["Use 200 characters or fewer."] },
      },
    });
    await expect(
      run(
        repo.create(
          workspaceId,
          { ...input, documentUrl: "http://example.com" },
          crypto.randomUUID(),
        ),
      ),
    ).rejects.toMatchObject({ kind: "validation" });
  });
  it("requires manage permission and the current version", async () => {
    const repo = createMockEngagementRepository();
    await expect(
      run(
        repo.close(workspaceId, first.id, {
          expectedVersion: first.version,
          reason: "Completed",
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    __setMockPersona("u-mai");
    await expect(
      run(
        repo.close(workspaceId, first.id, {
          expectedVersion: 1,
          reason: "Completed",
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
    const closed = await run(
      repo.close(workspaceId, first.id, {
        expectedVersion: first.version,
        reason: "Completed",
      }),
    );
    expect(closed.status).toBe("Closed");
    expect(closed.version).toBe(first.version + 1);
    expect(
      (
        await run(
          repo.reopen(workspaceId, first.id, {
            expectedVersion: closed.version,
            reason: "More work",
          }),
        )
      ).status,
    ).toBe("Active");
  });
  it("preserves original milestone dates and rejects stale milestone versions", async () => {
    __setMockPersona("u-mai");
    const repo = createMockEngagementRepository();
    const milestone = first.milestones[1];
    if (!milestone) throw new Error("Missing milestone");
    const changed = await run(
      repo.changeMilestoneDate(workspaceId, first.id, milestone.id, {
        expectedVersion: milestone.version,
        targetDate: "2027-02-01",
        reason: "Adjusted plan",
      }),
    );
    expect(changed.originalTargetDate).toBe(milestone.originalTargetDate);
    expect(changed.currentTargetDate).toBe("2027-02-01");
    await expect(
      run(
        repo.changeMilestoneDate(workspaceId, first.id, milestone.id, {
          expectedVersion: milestone.version,
          targetDate: "2027-03-01",
          reason: "Adjusted plan",
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
  });
});
