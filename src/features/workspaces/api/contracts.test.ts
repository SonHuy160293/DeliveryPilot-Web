import { describe, expect, it } from "vitest";
import { unwrapApiResponse } from "@/lib/api/apiResponse";
import {
  decode,
  member,
  workspace,
  creationSnapshot,
  invitationPreview,
  role,
} from "@/features/workspaces/api/contracts";
import {
  auditEvent,
  auditInput,
} from "@/features/workspaces/api/auditContracts";
import {
  assignmentInput,
  issueInput,
  roleInput,
  safeReason,
} from "@/features/workspaces/api/inputs";
import {
  organizationFixtures as f,
  auditChangeSamples,
} from "@/mocks/workspaces";

describe("Organization wire validation", () => {
  it.each(auditChangeSamples)(
    "decodes the registered $action history projection",
    (sample) => {
      expect(auditEvent.parse({ ...f.audit, ...sample })).toMatchObject(sample);
    },
  );
  it.each([
    { success: true, data: f.member },
    { success: true, data: f.member, error: {} },
    {
      success: false,
      data: f.member,
      error: { code: "Failure", message: "private" },
    },
    { success: false, data: null, error: null },
    { success: true, error: null },
  ])("rejects inconsistent envelopes", (value) => {
    expect(() => unwrapApiResponse(value)).toThrow();
  });
  it.each([
    { ...f.member, version: Number.MAX_SAFE_INTEGER + 1 },
    { ...f.member, version: "2" },
    { ...f.member, version: 0 },
    { ...f.member, roles: null },
    { ...f.member, joinedAt: "yesterday" },
    { ...f.member, primaryEmail: undefined },
    { ...f.member, membershipId: "a-slug" },
  ])("rejects malformed membership payloads", (value) => {
    expect(() => decode(member, value)).toThrow("could not be read");
  });
  it("keeps creation snapshots, current badges, offers and role revisions distinct", () => {
    expect(creationSnapshot.safeParse(f.workspace).success).toBe(false);
    expect(workspace.safeParse(f.creation).success).toBe(false);
    expect(
      invitationPreview.safeParse({
        ...f.preview,
        offeredRoles: f.member.roles,
      }).success,
    ).toBe(false);
    expect(role.parse({ ...f.role, futureField: true })).not.toHaveProperty(
      "futureField",
    );
    expect(member.parse({ ...f.member, futureField: true })).toEqual(f.member);
  });
  it("enforces closed requests, distinct role IDs, positive versions and safe reasons", () => {
    expect(
      issueInput.safeParse({
        recipientEmail: "a@example.test",
        roleIds: [f.role.id, f.role.id.toUpperCase()],
      }).success,
    ).toBe(false);
    expect(
      roleInput.safeParse({
        name: "Reviewer",
        description: null,
        permissionCodes: ["organization.members.read"],
        code: "invented",
      }).success,
    ).toBe(false);
    expect(
      assignmentInput.safeParse({ expectedMembershipVersion: -1 }).success,
    ).toBe(false);
    for (const value of [
      "",
      "Bearer secret",
      "secret=value",
      "https://example.test",
      "a@example.test",
    ])
      expect(safeReason.safeParse(value).success).toBe(false);
  });
  it("validates typed audit changes, null actors and bound filter instants", () => {
    expect(auditEvent.parse(f.audit)).toEqual(f.audit);
    expect(
      auditEvent.safeParse({ ...f.audit, targetType: "OrganizationRole" })
        .success,
    ).toBe(false);
    expect(
      auditEvent.safeParse({ ...f.audit, action: "organization.unknown" })
        .success,
    ).toBe(false);
    expect(
      auditInput.safeParse({
        from: "2026-11-05T00:00:00",
        to: "2026-11-06T00:00:00Z",
      }).success,
    ).toBe(false);
    expect(
      auditInput.safeParse({
        from: "2026-11-06T00:00:00Z",
        to: "2026-11-05T00:00:00Z",
      }).success,
    ).toBe(false);
    expect(auditInput.safeParse({ targetId: "", cursor: "" }).success).toBe(
      false,
    );
  });
});
