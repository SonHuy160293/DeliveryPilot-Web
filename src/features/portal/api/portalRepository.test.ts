import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { mockPortalRepository as repo } from "@/features/portal/api/mockPortalRepository";
import { getProjectRepository } from "@/features/projects/api/projectRepository";
import { getSharingRepository } from "@/features/sharing/api/sharingRepository";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import { firstProject, projectPerson } from "@/test/fixtures/projectMock";
import { organizationIds } from "@/mocks/workspaces";
import { settleMock as run } from "@/test/fixtures/mockClock";
import { ApiError } from "@/lib/api/apiError";
const id = firstProject.detail.id,
  wid = organizationIds.organization;
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
describe("guest portal repository", () => {
  it("returns a minimal safe projection for an active guest", async () => {
    const list = await run(repo.list()),
      view = await run(repo.view(id));
    expect(list).toHaveLength(1);
    expect(view).toMatchObject({
      projectId: id,
      myRoles: ["Viewer"],
      roleAccess: { editBrief: false, editStakeholders: false },
    });
    expect(view.sharedBriefItems.map((row) => row.code)).toEqual([
      "Problem",
      "ScopeAndExclusions",
    ]);
    expect(view.sharedStakeholders).toHaveLength(1);
    expect(JSON.stringify(view)).not.toMatch(
      /primaryEmail|participantId|contractAmount|contractCurrency|plannedEffort|contacts|reason|waiver|invitations|hasActiveAdministrator/,
    );
  });
  it("makes non-guest and unknown IDs indistinguishable", async () => {
    const missing: unknown = await run(repo.view(crypto.randomUUID())).catch(
      (error: unknown) => error,
    );
    __setMockPersona("u-linh");
    const member: unknown = await run(repo.view(id)).catch(
      (error: unknown) => error,
    );
    expect(missing).toBeInstanceOf(ApiError);
    expect(member).toBeInstanceOf(ApiError);
    if (!(missing instanceof ApiError) || !(member instanceof ApiError))
      throw new Error("Expected API errors");
    expect(member).toMatchObject({
      kind: missing.kind,
      message: missing.message,
    });
    expect(await run(repo.list())).toEqual([]);
  });
  it("uses current vendor shares and stops showing a withdrawn item", async () => {
    __setMockPersona("u-linh");
    const sharing = getSharingRepository(),
      before = await run(sharing.list(wid, id));
    const problem = before.find((row) => row.briefItemCode === "Problem");
    if (!problem) throw new Error("Missing share");
    await run(
      sharing.withdraw(wid, id, problem.id, {
        expectedVersion: problem.version,
        reason: null,
      }),
    );
    __setMockPersona("u-tomasz");
    expect(
      (await run(repo.view(id))).sharedBriefItems.map((row) => row.code),
    ).not.toContain("Problem");
  });
  it("does not reveal vendor organization names when a vendor stakeholder is shared", async () => {
    __setMockPersona("u-linh");
    const stakeholder = (
      await run(getProjectRepository().listStakeholders(wid, id, false))
    ).find((row) => row.side === "Vendor");
    if (!stakeholder) throw new Error("Missing vendor stakeholder");
    await run(
      getSharingRepository().share(wid, id, {
        itemType: "Stakeholder",
        stakeholderId: stakeholder.id,
      }),
    );
    __setMockPersona("u-tomasz");
    const view = await run(repo.view(id));
    expect(
      view.sharedStakeholders.find((row) => row.id === stakeholder.id)
        ?.organizationName,
    ).toBeNull();
    expect(JSON.stringify(view)).not.toContain(stakeholder.organizationName);
  });
  it("returns no data after a guest leaves", async () => {
    await run(repo.leave(id));
    expect(await run(repo.list())).toEqual([]);
    await expect(run(repo.view(id))).rejects.toMatchObject({
      kind: "not-found",
    });
  });
  it("enforces guest editing roles and versions without changing private stakeholder fields", async () => {
    __setMockPersona("u-mai");
    const projects = getProjectRepository(),
      people = await run(projects.listParticipants(wid, id));
    const guest = people.find(
      (row) => row.userId === projectPerson("u-tomasz").id,
    );
    if (!guest) throw new Error("Missing guest");
    await run(
      projects.changeRoles(wid, id, guest.id, {
        roles: ["ProjectManager"],
        expectedVersion: guest.version,
      }),
    );
    __setMockPersona("u-tomasz");
    const view = await run(repo.view(id));
    expect(view.roleAccess).toEqual({
      editBrief: true,
      editStakeholders: true,
    });
    const brief = view.editableBrief,
      stakeholder = view.editableStakeholders?.[0];
    if (!brief || !stakeholder) throw new Error("Missing edit data");
    await run(
      repo.updateBrief(id, {
        item: "Problem",
        value: "Guest update",
        expectedVersion: brief.version,
      }),
    );
    const freshBrief = (await run(repo.view(id))).editableBrief;
    if (!freshBrief) throw new Error("Missing brief");
    await run(
      repo.updateBrief(id, {
        item: "ProductGoal",
        value: "A new goal",
        expectedVersion: freshBrief.version,
      }),
    );
    const nextGoal = await run(repo.view(id));
    expect(nextGoal.productGoal).toBe("A new goal");
    expect(nextGoal.editableBrief?.previousProductGoals[0]?.value).toBe(
      freshBrief.productGoal,
    );
    await expect(
      run(
        repo.updateBrief(id, {
          item: "Problem",
          value: "Old",
          expectedVersion: brief.version,
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
    await run(
      repo.updateStakeholder(id, stakeholder.id, {
        name: stakeholder.name,
        side: stakeholder.side,
        organizationName: stakeholder.organizationName,
        responsibilities: "Updated",
        decisionAreas: stakeholder.decisionAreas,
        version: stakeholder.version,
      }),
    );
    __setMockPersona("u-mai");
    const updated = (await run(projects.listStakeholders(wid, id, false))).find(
      (row) => row.id === stakeholder.id,
    );
    expect(updated).toMatchObject({
      responsibilities: "Updated",
      email: "tomasz.nowak@larkspur.example",
    });
  });
});
