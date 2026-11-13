import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import {
  createProjectMock,
  firstProject,
  draftProject,
  projectWorkspace as wid,
  projectPerson,
} from "@/test/fixtures/projectMock";
import { settleMock as run } from "@/test/fixtures/mockClock";
import type { ProjectRepository } from "@/features/projects/api/projectRepository";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T04:00:00Z"));
  __resetMocks();
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
const id = firstProject.detail.id;
async function target(
  repo: ProjectRepository,
  userKey: Parameters<typeof projectPerson>[0],
  projectId = id,
) {
  const value = (await run(repo.listParticipants(wid, projectId))).find(
    (item) => item.userId === projectPerson(userKey).id,
  );
  if (!value) throw new Error("Missing participant");
  return value;
}
describe("project role matrix", () => {
  it.each([
    ["u-mai", true, true, true, true],
    ["u-linh", true, true, true, false],
    ["u-sofia", true, false, false, false],
    ["u-arjun", false, false, false, false],
    ["u-hannah", false, false, false, false],
  ] as const)(
    "derives permissions for %s from active project roles",
    async (
      persona,
      editBrief,
      editStakeholders,
      manageParticipants,
      manageAdministrators,
    ) => {
      __setMockPersona(persona);
      const row = await run(createProjectMock().get(wid, id));
      expect(row.permissions).toMatchObject({
        editBrief,
        editStakeholders,
        manageParticipants,
        manageAdministrators,
        assignClientPo: manageAdministrators,
      });
    },
  );
  it("lets a BA edit brief but denies team, guest, cadence, stakeholders and history mutations/reads", async () => {
    __setMockPersona("u-sofia");
    const repo = createProjectMock(),
      brief = await run(repo.getBrief(wid, id));
    await run(
      repo.updateBriefItem(wid, id, {
        expectedVersion: brief.version,
        item: "Problem",
        value: "Updated problem",
      }),
    );
    await expect(
      run(
        repo.addParticipant(wid, id, {
          userId: projectPerson("u-daniel").id,
          roles: ["Viewer"],
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(
      run(
        repo.inviteGuest(wid, id, {
          recipientEmail: "new@client.example",
          offeredRoleCode: "Viewer",
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(
      run(repo.setSprintLength(wid, id, 3, firstProject.detail.version + 1)),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(run(repo.history(wid, id, {}))).rejects.toMatchObject({
      kind: "forbidden",
    });
  });
  it("permits guest PM/BA brief editing and guest PM stakeholders without management or private email fields", async () => {
    const repo = createProjectMock();
    __setMockPersona("u-mai");
    const guest = await target(repo, "u-tomasz");
    const pm = await run(
      repo.changeRoles(wid, id, guest.id, {
        expectedVersion: guest.version,
        roles: ["ProjectManager"],
      }),
    );
    __setMockPersona("u-tomasz");
    const brief = await run(repo.getBrief(wid, id));
    expect(brief.productGoal).not.toBeNull();
    await run(
      repo.updateBriefItem(wid, id, {
        expectedVersion: brief.version,
        item: "OpenQuestions",
        value: "Guest question",
      }),
    );
    const stakeholders = await run(repo.listStakeholders(wid, id, true));
    expect(
      stakeholders.every(
        (item) =>
          item.email === null &&
          item.participantId === null &&
          item.retiredAt === null,
      ),
    ).toBe(true);
    expect(
      (await run(repo.listParticipants(wid, id))).every(
        (item) => item.primaryEmail === null,
      ),
    ).toBe(true);
    await expect(run(repo.listInvitations(wid, id))).rejects.toMatchObject({
      kind: "not-found",
    });
    __setMockPersona("u-mai");
    await run(
      repo.changeRoles(wid, id, guest.id, {
        expectedVersion: pm.version,
        roles: ["BusinessAnalyst"],
      }),
    );
    __setMockPersona("u-tomasz");
    expect(await run(repo.getBrief(wid, id))).toBeDefined();
    await expect(
      run(repo.listStakeholders(wid, id, false)),
    ).rejects.toMatchObject({ kind: "forbidden" });
  });
});
describe("team and last-administrator invariants", () => {
  it("blocks removing/demoting the last administrator with exact copy, then allows demotion after another is appointed", async () => {
    __setMockPersona("u-mai");
    const repo = createProjectMock(),
      mai = await target(repo, "u-mai");
    const denial = {
      kind: "conflict",
      message:
        "A project needs at least one administrator. Make someone else an administrator first.",
    };
    await expect(
      run(
        repo.changeRoles(wid, id, mai.id, {
          expectedVersion: mai.version,
          roles: ["Viewer"],
        }),
      ),
    ).rejects.toMatchObject(denial);
    await expect(
      run(
        repo.endParticipation(wid, id, mai.id, {
          expectedVersion: mai.version,
          reason: null,
        }),
      ),
    ).rejects.toMatchObject(denial);
    await run(
      repo.addParticipant(wid, id, {
        userId: projectPerson("u-daniel").id,
        roles: ["ProjectAdministrator"],
      }),
    );
    expect(
      (
        await run(
          repo.changeRoles(wid, id, mai.id, {
            expectedVersion: mai.version,
            roles: ["Viewer"],
          }),
        )
      ).roles,
    ).toEqual(["Viewer"]);
    expect(
      (await run(repo.get(wid, id))).permissions.manageAdministrators,
    ).toBe(false);
  });
  it("allows a PM to manage members but not grant/remove administrator or assign client PO", async () => {
    const repo = createProjectMock(),
      mai = await target(repo, "u-mai"),
      sofia = await target(repo, "u-sofia");
    await expect(
      run(
        repo.changeRoles(wid, id, sofia.id, {
          expectedVersion: sofia.version,
          roles: ["ProjectAdministrator"],
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(
      run(
        repo.endParticipation(wid, id, mai.id, {
          expectedVersion: mai.version,
          reason: null,
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await expect(
      run(repo.assignClientPo(wid, id, null, firstProject.detail.version)),
    ).rejects.toMatchObject({ kind: "forbidden" });
    const added = await run(
      repo.addParticipant(wid, id, {
        userId: projectPerson("u-daniel").id,
        roles: ["Viewer"],
      }),
    );
    await expect(
      run(
        repo.addParticipant(wid, id, {
          userId: added.userId,
          roles: ["Viewer"],
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
    await run(
      repo.endParticipation(wid, id, added.id, {
        expectedVersion: added.version,
        reason: null,
      }),
    );
    const rejoined = await run(
      repo.addParticipant(wid, id, {
        userId: added.userId,
        roles: ["BusinessAnalyst"],
      }),
    );
    expect(rejoined.id).toBe(added.id);
    expect(rejoined.firstJoinedAt).toBe(added.firstJoinedAt);
    expect(rejoined.version).toBe(3);
    await expect(
      run(
        repo.addParticipant(wid, id, {
          userId: projectPerson("u-tomasz").id,
          roles: ["Viewer"],
        }),
      ),
    ).rejects.toMatchObject({ kind: "validation" });
  });
  it("rejects guest administrator roles and stale participant versions", async () => {
    __setMockPersona("u-mai");
    const repo = createProjectMock(),
      guest = await target(repo, "u-tomasz");
    await expect(
      run(
        repo.changeRoles(wid, id, guest.id, {
          expectedVersion: guest.version,
          roles: ["ProjectAdministrator"],
        }),
      ),
    ).rejects.toMatchObject({ kind: "validation" });
    const sofia = await target(repo, "u-sofia");
    await run(
      repo.changeRoles(wid, id, sofia.id, {
        expectedVersion: sofia.version,
        roles: ["Developer"],
      }),
    );
    await expect(
      run(
        repo.endParticipation(wid, id, sofia.id, {
          expectedVersion: sofia.version,
          reason: null,
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
    __setMockPersona("u-sofia");
    expect((await run(repo.get(wid, id))).permissions.editBrief).toBe(false);
  });
  it("clears client PO on revocation or guest leave and denies removed participants on their next action", async () => {
    const repo = createProjectMock(),
      guest = await target(repo, "u-tomasz");
    await run(
      repo.endParticipation(wid, id, guest.id, {
        expectedVersion: guest.version,
        reason: null,
      }),
    );
    expect((await run(repo.get(wid, id))).clientProductOwner).toBeNull();
    __setMockPersona("u-tomasz");
    await expect(run(repo.listParticipants(wid, id))).rejects.toMatchObject({
      kind: "not-found",
    });
    __resetMocks();
    const second = createProjectMock();
    await run(second.listMine(wid));
    __setMockPersona("u-tomasz");
    await run(second.leave(id));
    await expect(run(second.listParticipants(wid, id))).rejects.toMatchObject({
      kind: "not-found",
    });
    __setMockPersona("u-linh");
    expect((await run(second.get(wid, id))).clientProductOwner).toBeNull();
  });
  it("assigns only an active guest as client PO and checks the project version", async () => {
    __setMockPersona("u-mai");
    const repo = createProjectMock(),
      guest = await target(repo, "u-tomasz"),
      member = await target(repo, "u-sofia");
    await expect(
      run(repo.assignClientPo(wid, id, member.id, firstProject.detail.version)),
    ).rejects.toMatchObject({ kind: "not-found" });
    const removed = await run(
      repo.assignClientPo(wid, id, null, firstProject.detail.version),
    );
    expect(removed.clientProductOwner).toBeNull();
    await expect(
      run(repo.assignClientPo(wid, id, guest.id, firstProject.detail.version)),
    ).rejects.toMatchObject({ kind: "conflict" });
    expect(
      (await run(repo.assignClientPo(wid, id, guest.id, removed.version)))
        .clientProductOwner?.participantId,
    ).toBe(guest.id);
  });
});
describe("guest invitations, stakeholders and activation", () => {
  it("enforces one pending invitation per normalized email, versioned resend/cancel and seven-day expiry", async () => {
    const repo = createProjectMock(),
      existing = (await run(repo.listInvitations(wid, id)))[0];
    if (!existing) throw new Error("Missing invitation");
    await expect(
      run(
        repo.inviteGuest(wid, id, {
          recipientEmail: " GRACE.LIU@LARKSPUR.EXAMPLE ",
          offeredRoleCode: "Viewer",
        }),
      ),
    ).rejects.toMatchObject({
      kind: "conflict",
      message: "This person already has a pending invitation.",
    });
    const resent = await run(
      repo.resendInvitation(wid, id, existing.id, existing.version),
    );
    expect(Date.parse(resent.expiresAt) - Date.parse(resent.lastIssuedAt)).toBe(
      604800000,
    );
    await expect(
      run(repo.cancelInvitation(wid, id, existing.id, existing.version)),
    ).rejects.toMatchObject({ kind: "conflict" });
    await run(repo.cancelInvitation(wid, id, existing.id, resent.version));
    const invited = await run(
      repo.inviteGuest(wid, id, {
        recipientEmail: existing.recipientEmail,
        offeredRoleCode: "Viewer",
      }),
    );
    expect(invited.status).toBe("Pending");
    vi.setSystemTime(Date.now() + 8 * 86400000);
    expect(
      (await run(repo.listInvitations(wid, id))).find(
        (item) => item.id === invited.id,
      )?.status,
    ).toBe("Expired");
    await expect(
      run(
        repo.inviteGuest(wid, id, {
          recipientEmail: projectPerson("u-sofia").primaryEmail,
          offeredRoleCode: "Viewer",
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
  });
  it("creates invitations only for nonmembers who are not already active participants", async () => {
    const repo = createProjectMock();
    await expect(
      run(
        repo.inviteGuest(wid, id, {
          recipientEmail: projectPerson("u-tomasz").primaryEmail,
          offeredRoleCode: "Viewer",
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
    expect(
      (
        await run(
          repo.inviteGuest(wid, id, {
            recipientEmail: "new.guest@client.example",
            offeredRoleCode: "QualityAssurance",
          }),
        )
      ).offeredRoleCode,
    ).toBe("QualityAssurance");
  });
  it("validates versioned stakeholder changes and retirement", async () => {
    const repo = createProjectMock(),
      input = {
        name: "Sponsor",
        side: "Client",
        organizationName: null,
        responsibilities: null,
        decisionAreas: null,
        email: null,
        participantId: null,
        version: 1,
      } as const;
    const created = await run(repo.saveStakeholder(wid, id, null, input));
    const edited = await run(
      repo.saveStakeholder(wid, id, created.id, {
        ...input,
        name: "Sponsor updated",
        version: created.version,
      }),
    );
    await expect(
      run(repo.retireStakeholder(wid, id, created.id, created.version)),
    ).rejects.toMatchObject({ kind: "conflict" });
    await run(repo.retireStakeholder(wid, id, created.id, edited.version));
    expect(
      (await run(repo.listStakeholders(wid, id, false))).some(
        (item) => item.id === created.id,
      ),
    ).toBe(false);
    expect(
      (await run(repo.listStakeholders(wid, id, true))).find(
        (item) => item.id === created.id,
      )?.retiredAt,
    ).not.toBeNull();
  });
  it("returns the full activation gap list and activates only after required setup plus waiver", async () => {
    const repo = createProjectMock(),
      projectId = draftProject.detail.id;
    await expect(
      run(
        repo.activate(wid, projectId, {
          expectedVersion: draftProject.detail.version,
          clientPoWaiverReason: null,
        }),
      ),
    ).rejects.toMatchObject({
      kind: "validation",
      gaps: ["ProductGoal", "ProjectManager", "ClientProductOwnerWaiver"],
    });
    const me = await target(repo, "u-linh", projectId);
    await run(
      repo.changeRoles(wid, projectId, me.id, {
        expectedVersion: me.version,
        roles: ["ProjectAdministrator", "ProjectManager"],
      }),
    );
    const brief = await run(repo.getBrief(wid, projectId));
    await run(
      repo.updateBriefItem(wid, projectId, {
        expectedVersion: brief.version,
        item: "ProductGoal",
        value: "Launch fleet telemetry",
      }),
    );
    const latest = await run(repo.get(wid, projectId));
    await expect(
      run(
        repo.activate(wid, projectId, {
          expectedVersion: latest.version,
          clientPoWaiverReason: null,
        }),
      ),
    ).rejects.toMatchObject({ gaps: ["ClientProductOwnerWaiver"] });
    const active = await run(
      repo.activate(wid, projectId, {
        expectedVersion: latest.version,
        clientPoWaiverReason: "Client PO will join after pilot",
      }),
    );
    expect(active.status).toBe("Active");
    expect(active.clientPoWaiverReason).toBe("Client PO will join after pilot");
    await expect(
      run(
        repo.activate(wid, projectId, {
          expectedVersion: active.version,
          clientPoWaiverReason: null,
        }),
      ),
    ).rejects.toMatchObject({ kind: "conflict" });
  });
  it("changes kind/engagement only for a Draft PA with engagement management permission", async () => {
    const repo = createProjectMock(),
      project = await run(repo.get(wid, draftProject.detail.id));
    await expect(
      run(
        repo.changeEngagement(wid, project.id, {
          expectedVersion: project.version,
          kind: "Internal",
          engagementId: null,
          reason: "Internal now",
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
    await run(
      repo.addParticipant(wid, project.id, {
        userId: projectPerson("u-mai").id,
        roles: ["ProjectAdministrator"],
      }),
    );
    __setMockPersona("u-mai");
    const latest = await run(repo.get(wid, project.id));
    const changed = await run(
      repo.changeEngagement(wid, project.id, {
        expectedVersion: latest.version,
        kind: "Internal",
        engagementId: null,
        reason: "Internal delivery",
      }),
    );
    expect(changed.kind).toBe("Internal");
    expect(changed.engagement).toBeNull();
    await expect(
      run(
        repo.changeEngagement(wid, id, {
          expectedVersion: firstProject.detail.version,
          kind: "Internal",
          engagementId: null,
          reason: "Change",
        }),
      ),
    ).rejects.toMatchObject({ kind: "forbidden" });
  });
});
