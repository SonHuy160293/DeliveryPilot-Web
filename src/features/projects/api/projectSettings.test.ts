import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { createMockProjectSettings } from "@/features/projects/api/mockProjectSettings";
import { createMockEngagementSummaryShares } from "@/features/sharing/api/mockEngagementSummaryShares";
import { projectEngagementAdapter } from "@/mocks/projectEngagementAdapter";
import { draftSharingRecord } from "@/test/fixtures/projectSettingsRecord";
import {
  createProjectMock,
  firstProject,
  draftProject,
  projectWorkspace as wid,
} from "@/test/fixtures/projectMock";
import { settleMock as run } from "@/test/fixtures/mockClock";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
  __setMockPersona("u-mai");
});
afterEach(() => {
  __resetMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
const id = firstProject.detail.id;
function setup() {
  const { record, workspace } = draftSharingRecord(),
    sharing = createMockEngagementSummaryShares();
  const old = record.detail.engagement;
  if (!old) throw new Error("Missing engagement");
  const activeEngagement = vi
    .fn()
    .mockResolvedValue({ ...old, id: draftProject.detail.engagement?.id });
  const methods = createMockProjectSettings(
    () => workspace,
    activeEngagement,
    sharing,
  );
  return { record, sharing, activeEngagement, methods };
}
describe("Draft engagement changes and automatic withdrawal", () => {
  it("withdraws the actual summary share, records attribution, clears Internal engagement and client PO", async () => {
    const { record, sharing, methods } = setup();
    const result = await run(
      methods.changeEngagement(wid, id, {
        kind: "Internal",
        engagementId: null,
        reason: "Internal initiative",
        expectedVersion: record.detail.version,
      }),
    );
    expect(result).toMatchObject({
      kind: "Internal",
      engagement: null,
      clientProductOwner: null,
      engagementSummaryWithdrawn: true,
    });
    expect(record.participants.some((row) => row.isClientProductOwner)).toBe(
      false,
    );
    const state = sharing.snapshot(wid);
    expect(state.shares[0]).toMatchObject({ status: "Withdrawn", version: 2 });
    expect(state.history[0]).toMatchObject({
      action: "Withdrawn",
      itemType: "EngagementSummary",
      actorDisplayName: "Mai Tran",
      reason: "Internal initiative",
    });
    expect(sharing.snapshot("other-workspace").shares[0]?.status).toBe(
      "Shared",
    );
  });
  it("withdraws the old summary on a different Client engagement without sharing its replacement", async () => {
    const { record, sharing, methods } = setup();
    const result = await run(
      methods.changeEngagement(wid, id, {
        kind: "Client",
        engagementId: draftProject.detail.engagement?.id ?? null,
        reason: "New agreement",
        expectedVersion: record.detail.version,
      }),
    );
    expect(result.engagementSummaryWithdrawn).toBe(true);
    expect(result.engagement?.id).toBe(draftProject.detail.engagement?.id);
    expect(
      sharing.snapshot(wid).shares.filter((row) => row.status === "Shared"),
    ).toHaveLength(0);
  });
  it("does not report a withdrawal when no share changed", async () => {
    const { record, methods, activeEngagement } = setup();
    activeEngagement.mockResolvedValue(record.detail.engagement);
    const result = await run(
      methods.changeEngagement(wid, id, {
        kind: "Client",
        engagementId: record.detail.engagement?.id ?? null,
        reason: "Review",
        expectedVersion: record.detail.version,
      }),
    );
    expect(result.engagementSummaryWithdrawn).toBe(false);
  });
  it.each(["conflict", "active", "readonly"] as const)(
    "leaves sharing untouched after %s rejection",
    async (kind) => {
      const { record, methods, sharing } = setup();
      if (kind === "active") record.detail.status = "Active";
      if (kind === "readonly") __setMockPersona("u-arjun");
      await expect(
        run(
          methods.changeEngagement(wid, id, {
            kind: "Internal",
            engagementId: null,
            reason: "Change",
            expectedVersion:
              record.detail.version + (kind === "conflict" ? 1 : 0),
          }),
        ),
      ).rejects.toBeDefined();
      expect(sharing.snapshot(wid).shares[0]?.status).toBe("Shared");
      expect(sharing.snapshot(wid).history).toEqual([]);
      expect(record.detail.engagement).not.toBeNull();
    },
  );
  it("rechecks project authority after the engagement dependency yields", async () => {
    const { record, methods, activeEngagement, sharing } = setup();
    activeEngagement.mockImplementation(() => {
      const pa = record.participants.find(
        (person) => person.displayName === "Mai Tran",
      );
      if (!pa) throw new Error("Missing PA");
      pa.roles = ["Viewer"];
      return Promise.resolve(firstProject.detail.engagement);
    });
    await expect(
      run(
        methods.changeEngagement(wid, id, {
          kind: "Client",
          engagementId: draftProject.detail.engagement?.id ?? null,
          reason: "New agreement",
          expectedVersion: record.detail.version,
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    expect(sharing.snapshot(wid).shares[0]?.status).toBe("Shared");
  });
  it("resets summary state and avoids duplicate withdrawal events", () => {
    const { sharing } = setup(),
      input = {
        workspaceId: wid,
        projectId: id,
        engagementId: firstProject.detail.engagement?.id ?? null,
        actorUserId: firstProject.detail.createdByUserId,
        actorDisplayName: "Mai Tran",
        reason: "Internal",
      };
    expect(sharing.withdrawEngagementSummary(input)).toBe(true);
    expect(sharing.withdrawEngagementSummary(input)).toBe(false);
    expect(sharing.snapshot(wid).history).toHaveLength(1);
    __resetMocks();
    expect(sharing.snapshot(wid).shares[0]?.status).toBe("Shared");
    expect(sharing.snapshot(wid).history).toEqual([]);
  });
});
describe("settings query admission", () => {
  it("denies unqualified engagement option reads before the bridge and exposes only display names in settings context", async () => {
    const bridge = vi.spyOn(projectEngagementAdapter, "listVisible"),
      repo = createProjectMock();
    __setMockPersona("u-linh");
    await expect(
      run(repo.engagementOptions(wid, draftProject.detail.id)),
    ).rejects.toMatchObject({ kind: "forbidden" });
    expect(bridge).not.toHaveBeenCalled();
    const context = await run(repo.settingsContext(wid, id));
    expect(context.people[firstProject.detail.activatedByUserId ?? ""]).toBe(
      "Mai Tran",
    );
    expect(JSON.stringify(context)).not.toMatch(/@|primaryEmail|contract/);
    __setMockPersona("u-tomasz");
    await expect(run(repo.settingsContext(wid, id))).rejects.toMatchObject({
      kind: "not-found",
    });
  });
});
