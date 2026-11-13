import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { createMockProjectRecipient } from "@/features/projects/api/mockProjectRecipient";
import {
  createProjectMock,
  firstProject,
  projectWorkspace as wid,
  projectPerson,
} from "@/test/fixtures/projectMock";
import { draftSharingRecord } from "@/test/fixtures/projectSettingsRecord";
import {
  guestInvitationFixtures,
  projectInvitationPreviewFixture as preview,
} from "@/mocks/projects";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import { settleMock as run } from "@/test/fixtures/mockClock";
import {
  invitationPreview,
  participant,
} from "@/features/projects/api/contracts";
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-12T04:00:00Z"));
  __resetMocks();
  __setMockPersona("u-grace");
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
function setup() {
  const { record, workspace } = draftSharingRecord();
  record.invitations = structuredClone(
    guestInvitationFixtures["019a4000-0000-7000-8000-000000000001"],
  );
  const invite = record.invitations[0];
  if (!invite) throw new Error("Missing invitation");
  return {
    record,
    invite,
    repository: createMockProjectRecipient(() => workspace),
  };
}
describe("mock project invitation responses", () => {
  it("parses the supplied recipient fixture and accepts any non-empty proof for Grace", async () => {
    expect(invitationPreview.parse(preview)).toEqual(preview);
    const { repository, record } = setup();
    const result = await run(repository.preview(preview.invitationId, "x"));
    expect(result).toMatchObject({ kind: "preview", preview });
    expect(
      await run(repository.accept(preview.invitationId, "x", preview.version)),
    ).toEqual({ projectId: firstProject.detail.id });
    const guests = record.participants.filter(
      (row) => row.userId === projectPerson("u-grace").id,
    );
    expect(guests).toHaveLength(1);
    expect(participant.parse(guests[0])).toMatchObject({
      kind: "Guest",
      roles: ["BusinessAnalyst"],
      status: "Active",
    });
    expect(
      await run(repository.accept(preview.invitationId, "x", preview.version)),
    ).toEqual({ projectId: firstProject.detail.id });
    expect(
      record.participants.filter(
        (row) => row.userId === projectPerson("u-grace").id,
      ),
    ).toHaveLength(1);
  });
  it("updates the shared vendor invitation store after guest acceptance", async () => {
    __setMockPersona("u-linh");
    const repo = createProjectMock();
    await run(repo.get(wid, firstProject.detail.id));
    __setMockPersona("u-grace");
    await run(
      repo.recipient.accept(preview.invitationId, "proof", preview.version),
    );
    __setMockPersona("u-linh");
    expect(
      (await run(repo.listInvitations(wid, firstProject.detail.id))).find(
        (item) => item.id === preview.invitationId,
      )?.status,
    ).toBe("Accepted");
    expect(
      (await run(repo.listParticipants(wid, firstProject.detail.id))).find(
        (item) => item.userId === projectPerson("u-grace").id,
      )?.kind,
    ).toBe("Guest");
  });
  it.each(["Expired", "Cancelled", "Declined", "Accepted"] as const)(
    "rejects terminal %s invitations without granting access",
    async (status) => {
      const { repository, invite, record } = setup();
      invite.status = status;
      await expect(
        run(repository.preview(invite.id, "proof")),
      ).rejects.toMatchObject({ problem: "unavailable" });
      await expect(
        run(repository.accept(invite.id, "proof", invite.version)),
      ).rejects.toMatchObject({ problem: "unavailable" });
      expect(
        record.participants.some(
          (row) => row.userId === projectPerson("u-grace").id,
        ),
      ).toBe(false);
    },
  );
  it("expires the invitation by its deadline and rejects a rotated version", async () => {
    const { repository, invite } = setup();
    invite.version++;
    await expect(
      run(repository.accept(invite.id, "proof", preview.version)),
    ).rejects.toMatchObject({ problem: "unavailable" });
    vi.setSystemTime(new Date("2026-11-19T04:00:00Z"));
    await expect(
      run(repository.preview(invite.id, "proof")),
    ).rejects.toMatchObject({ problem: "unavailable" });
    expect(invite.status).toBe("Expired");
  });
  it.each(["Expired", "Cancelled", "Declined", "Accepted"] as const)(
    "uses the generic outcome for %s invitations even with a different email",
    async (status) => {
      const { repository, invite } = setup();
      invite.status = status;
      __setMockPersona("u-tomasz");
      await expect(
        run(repository.preview(invite.id, "proof")),
      ).rejects.toMatchObject({ problem: "unavailable" });
    },
  );
  it.each(["deadline", "inviter authority"])(
    "checks %s before disclosing an email mismatch",
    async (reason) => {
      const { repository, invite, record } = setup();
      if (reason === "deadline") invite.expiresAt = "2026-11-11T04:00:00Z";
      else {
        const issuer = record.participants.find(
          (row) => row.userId === invite.issuedByUserId,
        );
        if (!issuer) throw new Error("Missing inviter");
        issuer.roles = ["Viewer"];
      }
      __setMockPersona("u-tomasz");
      await expect(
        run(repository.preview(invite.id, "proof")),
      ).rejects.toMatchObject({ problem: "unavailable" });
    },
  );
  it("checks email, vendor membership, inviter authority and blank proof", async () => {
    const { repository, invite, record } = setup();
    __setMockPersona("u-tomasz");
    await expect(
      run(repository.preview(invite.id, "proof")),
    ).rejects.toMatchObject({ problem: "mismatch" });
    __setMockPersona("u-linh");
    invite.recipientEmail = projectPerson("u-linh").primaryEmail;
    await expect(
      run(repository.preview(invite.id, "proof")),
    ).rejects.toMatchObject({ problem: "member" });
    __setMockPersona("u-grace");
    invite.recipientEmail = projectPerson("u-grace").primaryEmail;
    const issuer = record.participants.find(
      (row) => row.userId === invite.issuedByUserId,
    );
    if (!issuer) throw new Error("Missing inviter");
    issuer.roles = ["Viewer"];
    await expect(
      run(repository.preview(invite.id, "proof")),
    ).rejects.toMatchObject({ problem: "unavailable" });
    await expect(run(repository.preview(invite.id, ""))).rejects.toMatchObject({
      problem: "unavailable",
    });
  });
  it("declines with a version check and never grants project or workspace membership", async () => {
    const { repository, invite, record } = setup();
    await expect(
      run(repository.decline(invite.id, "proof", invite.version + 1)),
    ).rejects.toMatchObject({ problem: "unavailable" });
    await run(repository.decline(invite.id, "proof", invite.version));
    expect(invite.status).toBe("Declined");
    expect(
      record.participants.some(
        (row) => row.userId === projectPerson("u-grace").id,
      ),
    ).toBe(false);
  });
  it("signals a former member and replaces their active project membership with guest roles", async () => {
    const { repository, record, invite } = setup();
    const former = record.participants.find(
      (row) => row.userId === projectPerson("u-oskar").id,
    );
    if (!former) throw new Error("Missing former participant");
    former.status = "Active";
    former.roles = ["Developer"];
    invite.recipientEmail = projectPerson("u-oskar").primaryEmail;
    __setMockPersona("u-oskar");
    expect(await run(repository.preview(invite.id, "proof"))).toMatchObject({
      kind: "preview",
      preview: { replacesFormerMembership: true },
    });
    await run(repository.accept(invite.id, "proof", invite.version));
    expect(former).toMatchObject({
      kind: "Guest",
      status: "Active",
      roles: ["BusinessAnalyst"],
    });
  });
  it("aborts an in-flight acceptance before changing participation", async () => {
    const { repository, invite, record } = setup(),
      controller = new AbortController(),
      pending = repository.accept(
        invite.id,
        "proof",
        invite.version,
        controller.signal,
      );
    controller.abort();
    await expect(run(pending)).rejects.toMatchObject({ kind: "cancelled" });
    expect(invite.status).toBe("Pending");
    expect(
      record.participants.some(
        (row) => row.userId === projectPerson("u-grace").id,
      ),
    ).toBe(false);
  });
});
