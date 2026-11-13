import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import {
  createProjectMock,
  firstProject,
  projectWorkspace as wid,
} from "@/test/fixtures/projectMock";
import { settleMock as run } from "@/test/fixtures/mockClock";
import { __resetMocks } from "@/mocks/mockRuntime";
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
const input = {
  name: "Sponsor",
  side: "Client",
  organizationName: null,
  responsibilities: null,
  decisionAreas: null,
  email: null,
  participantId: null,
  version: 1,
} as const;
describe("stakeholder validation", () => {
  it.each([
    { name: "x".repeat(201) },
    { organizationName: "x".repeat(201) },
    { responsibilities: "x".repeat(2001) },
    { decisionAreas: "x".repeat(2001) },
    { email: "invalid" },
  ])(
    "rejects out-of-contract fields without creating a record",
    async (fields) => {
      const repo = createProjectMock();
      await expect(
        run(
          repo.saveStakeholder(wid, firstProject.detail.id, null, {
            ...input,
            ...fields,
          }),
        ),
      ).rejects.toMatchObject({ kind: "validation" });
      expect(
        await run(repo.listStakeholders(wid, firstProject.detail.id, false)),
      ).toHaveLength(3);
    },
  );
  it("rejects links to nonparticipants with the exact field error", async () => {
    await expect(
      run(
        createProjectMock().saveStakeholder(wid, firstProject.detail.id, null, {
          ...input,
          participantId: crypto.randomUUID(),
        }),
      ),
    ).rejects.toMatchObject({
      kind: "validation",
      details: {
        status: 422,
        fieldErrors: {
          participantId: ["Choose someone on the team, or leave this empty."],
        },
      },
    });
  });
});
