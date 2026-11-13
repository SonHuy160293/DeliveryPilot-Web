import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  createProjectMock,
  firstProject,
  projectWorkspace as wid,
  projectPerson,
} from "@/test/fixtures/projectMock";
import { settleMock as run } from "@/test/fixtures/mockClock";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import { projectEngagementAdapter } from "@/mocks/projectEngagementAdapter";
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
});
afterEach(() => {
  __resetMocks();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("participant-authorized engagement default marker", () => {
  it("returns only matching active guest IDs without contact data", async () => {
    __setMockPersona("u-mai");
    const repo = createProjectMock(),
      id = firstProject.detail.id;
    const participants = await run(repo.listParticipants(wid, id));
    const guest = participants.find(
      (row) => row.userId === projectPerson("u-tomasz").id,
    );
    expect(guest).toBeDefined();
    const context = await run(repo.teamContext(wid, id));
    expect(context).toEqual({ engagementDefaultParticipantIds: [guest?.id] });
    expect(JSON.stringify(context)).not.toMatch(
      /@|contacts|contract|amount|email/i,
    );
    if (!guest) throw new Error("Missing fixture");
    await run(
      repo.endParticipation(wid, id, guest.id, {
        expectedVersion: guest.version,
        reason: null,
      }),
    );
    expect(await run(repo.teamContext(wid, id))).toEqual({
      engagementDefaultParticipantIds: [],
    });
  });
  it("rejects PMs, read-only participants and guests before the engagement bridge", async () => {
    const bridge = vi.spyOn(projectEngagementAdapter, "clientPoMatches"),
      repo = createProjectMock();
    for (const persona of ["u-linh", "u-sofia", "u-tomasz"] as const) {
      __setMockPersona(persona);
      await expect(
        run(repo.teamContext(wid, firstProject.detail.id)),
      ).rejects.toBeDefined();
    }
    expect(bridge).not.toHaveBeenCalled();
  });
  it("matches the default email case-insensitively and never returns another contact", async () => {
    const result = await run(
      projectEngagementAdapter.clientPoMatches(
        wid,
        firstProject.detail.engagement?.id ?? "",
        [
          {
            id: "guest",
            email: projectPerson("u-tomasz").primaryEmail.toUpperCase(),
          },
          { id: "other", email: "nobody@client.example" },
        ],
      ),
    );
    expect(result).toEqual(["guest"]);
  });
});
