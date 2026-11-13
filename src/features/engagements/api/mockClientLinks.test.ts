import { beforeEach, afterEach, describe, it, expect, vi } from "vitest";
import { __resetMocks, __setMockPersona } from "@/mocks/mockRuntime";
import { clientLinkMock } from "@/features/engagements/api/mockClientLinks";
import { settleMock as run } from "@/test/fixtures/mockClock";
const wid = "019a1000-0000-7000-8000-000000000002";
beforeEach(() => {
  vi.useFakeTimers();
  __resetMocks();
  __setMockPersona("u-tomasz");
});
afterEach(() => {
  __resetMocks();
  vi.useRealTimers();
});
describe("client link mock", () => {
  it.each(["bad", "", "expired", "7KQ4-MZ2P-H9TX"])(
    "gives every invalid code the same outcome",
    async (code) => {
      await expect(
        run(clientLinkMock.preview(wid, code)),
      ).rejects.toMatchObject({
        kind: "validation",
        message: "This code can't be used. Ask the vendor for a new code.",
      });
    },
  );
  it("previews and confirms the supplied fictional code once", async () => {
    expect(await run(clientLinkMock.preview(wid, "7kq4-mz2p-h9td"))).toEqual({
      engagementName: "Fleet telemetry MVP",
      clientDisplayName: "Halden Logistics",
    });
    await run(clientLinkMock.confirm(wid, "7KQ4-MZ2P-H9TD"));
    expect(
      (await run(clientLinkMock.list(wid))).some(
        (row) => row.engagementName === "Fleet telemetry MVP",
      ),
    ).toBe(true);
    await expect(
      run(clientLinkMock.preview(wid, "7KQ4-MZ2P-H9TD")),
    ).rejects.toMatchObject({ kind: "validation" });
  });
  it("denies members without Owner or Admin authority", async () => {
    __setMockPersona("u-grace");
    await expect(run(clientLinkMock.list(wid))).rejects.toMatchObject({
      kind: "forbidden",
    });
  });
  it("rejects a code from its own workspace and an expired code", async () => {
    await expect(
      run(
        clientLinkMock.preview(
          "019a1000-0000-7000-8000-000000000001",
          "7KQ4-MZ2P-H9TD",
        ),
      ),
    ).rejects.toMatchObject({ details: { code: "ClientLink.OwnWorkspace" } });
    vi.setSystemTime(new Date("2026-11-19T00:00:00Z"));
    await expect(
      run(clientLinkMock.preview(wid, "7KQ4-MZ2P-H9TD")),
    ).rejects.toMatchObject({
      kind: "validation",
      message: "This code can't be used. Ask the vendor for a new code.",
    });
  });
});
