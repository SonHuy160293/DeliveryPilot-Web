import { http, delay } from "msw";
import { describe, expect, it } from "vitest";
import { workspaceApi as api } from "@/features/workspaces/api/workspaceApi";
import { recipientApi } from "@/features/workspaces/recipient/recipientApi";
import type { SessionOwner } from "@/features/workspaces/api/request";
import {
  organizationFixtures as f,
  organizationIds as ids,
} from "@/mocks/workspaces";
import {
  apiBase,
  orgBase,
  establishOrganizationSession,
  failure,
  paged,
  success,
} from "@/test/fixtures/organizationApi";
import { server } from "@/test/mocks/server";
import { authSession } from "@/lib/api/authSession";

const m = `${orgBase}/members/${ids.membership}`;
const r = `${orgBase}/roles/${ids.role}`;
const i = `${orgBase}/invitations/${ids.invitation}`;
const n = `${orgBase}/ownership-nominations/${ids.nomination}`;
const p = `${apiBase}/organization-invitations/${ids.invitation}`;
const mv = { expectedMembershipVersion: 1, reason: null };
const membership = {
  expectedMembershipVersion: 1,
  reason: "Contract completed",
};
const reason = { expectedVersion: 2, reason: "Offer reviewed" };
const optional = { expectedVersion: 2, reason: null };
const version = { expectedVersion: 2 };
const role = {
  name: "Reviewer",
  description: null,
  permissionCodes: ["organization.members.read"],
};
const issue = { recipientEmail: "morgan@example.test", roleIds: [ids.role] };
const secret = { invitationId: ids.invitation, proof: "a".repeat(43) };
type Case = {
  name: string;
  method: "GET" | "POST" | "PUT";
  url: string;
  body?: unknown;
  response: unknown;
  status?: number;
  params?: Record<string, string>;
  call: (owner: SessionOwner, signal: AbortSignal) => Promise<unknown>;
};
const cases: Case[] = [
  {
    name: "create",
    method: "POST",
    url: `${apiBase}/organizations`,
    body: { name: f.creation.name },
    response: f.creation,
    status: 201,
    call: (o, s) =>
      api.create(
        o,
        { name: ` ${f.creation.name} `, attemptId: ids.attempt },
        s,
      ),
  },
  {
    name: "discover",
    method: "GET",
    url: `${apiBase}/me/organizations`,
    response: paged([f.workspace], "opaque-next"),
    params: { limit: "50", cursor: "opaque-current" },
    call: (o, s) => api.discover(o, { cursor: "opaque-current" }, s),
  },
  {
    name: "me",
    method: "GET",
    url: `${orgBase}/members/me`,
    response: f.member,
    call: (o, s) => api.me(o, ids.organization, s),
  },
  {
    name: "members",
    method: "GET",
    url: `${orgBase}/members`,
    response: paged([f.member]),
    params: { status: "removed", limit: "50" },
    call: (o, s) => api.members(o, ids.organization, { status: "removed" }, s),
  },
  {
    name: "member",
    method: "GET",
    url: m,
    response: f.member,
    call: (o, s) => api.member(o, ids.organization, ids.membership, s),
  },
  {
    name: "grant",
    method: "POST",
    url: `${m}/roles/${ids.role}/grant`,
    body: mv,
    response: f.assignment,
    call: (o, s) =>
      api.grant(o, ids.organization, ids.membership, ids.role, mv, s),
  },
  {
    name: "revoke",
    method: "POST",
    url: `${m}/roles/${ids.role}/revoke`,
    body: mv,
    response: { ...f.assignment, changed: false },
    call: (o, s) =>
      api.revoke(o, ids.organization, ids.membership, ids.role, mv, s),
  },
  {
    name: "remove",
    method: "POST",
    url: `${m}/remove`,
    body: membership,
    response: f.removal,
    call: (o, s) =>
      api.remove(o, ids.organization, ids.membership, membership, s),
  },
  {
    name: "demote",
    method: "POST",
    url: `${m}/demote-owner`,
    body: membership,
    response: { ...f.removal, status: "active" },
    call: (o, s) =>
      api.demote(o, ids.organization, ids.membership, membership, s),
  },
  {
    name: "permissions",
    method: "GET",
    url: `${orgBase}/permissions`,
    response: { codes: ["organization.members.read"] },
    call: (o, s) => api.permissions(o, ids.organization, s),
  },
  {
    name: "roles",
    method: "GET",
    url: `${orgBase}/roles`,
    response: paged([f.role]),
    params: { limit: "50" },
    call: (o, s) => api.roles(o, ids.organization, {}, s),
  },
  {
    name: "create role",
    method: "POST",
    url: `${orgBase}/roles`,
    body: role,
    response: f.role,
    status: 201,
    call: (o, s) => api.createRole(o, ids.organization, role, s),
  },
  {
    name: "update role",
    method: "PUT",
    url: r,
    body: { ...role, ...version },
    response: { ...f.role, version: 4, permissionSetVersion: 3 },
    call: (o, s) =>
      api.updateRole(o, ids.organization, ids.role, { ...role, ...version }, s),
  },
  {
    name: "retire role",
    method: "POST",
    url: `${r}/retire`,
    body: reason,
    response: { ...f.role, retiredAt: f.creation.snapshotAt },
    call: (o, s) => api.retireRole(o, ids.organization, ids.role, reason, s),
  },
  {
    name: "issue",
    method: "POST",
    url: `${orgBase}/invitations`,
    body: issue,
    response: f.invitation,
    status: 201,
    call: (o, s) => api.issue(o, ids.organization, issue, s),
  },
  {
    name: "invitations",
    method: "GET",
    url: `${orgBase}/invitations`,
    response: paged([f.invitation]),
    params: { status: "pending", limit: "50" },
    call: (o, s) => api.invitations(o, ids.organization, {}, s),
  },
  {
    name: "invitation",
    method: "GET",
    url: i,
    response: f.invitation,
    call: (o, s) => api.invitation(o, ids.organization, ids.invitation, s),
  },
  {
    name: "resend",
    method: "POST",
    url: `${i}/resend`,
    body: optional,
    response: f.invitation,
    call: (o, s) =>
      api.resend(o, ids.organization, ids.invitation, optional, s),
  },
  {
    name: "reissue",
    method: "POST",
    url: `${i}/reissue`,
    body: { ...reason, roleIds: [ids.role] },
    response: { ...f.invitation, id: ids.replacement },
    call: (o, s) =>
      api.reissue(
        o,
        ids.organization,
        ids.invitation,
        { ...reason, roleIds: [ids.role] },
        s,
      ),
  },
  {
    name: "cancel invitation",
    method: "POST",
    url: `${i}/cancel`,
    body: reason,
    response: { ...f.invitation, status: "cancelled" },
    call: (o, s) =>
      api.cancelInvitation(o, ids.organization, ids.invitation, reason, s),
  },
  {
    name: "preview",
    method: "POST",
    url: `${p}/preview`,
    body: { proof: secret.proof },
    response: f.preview,
    call: (o, s) => recipientApi.preview(o, secret, s),
  },
  {
    name: "accept invitation",
    method: "POST",
    url: `${p}/accept`,
    body: { proof: secret.proof, ...version },
    response: f.acceptance,
    call: (o, s) => recipientApi.accept(o, secret, 2, s),
  },
  {
    name: "decline invitation",
    method: "POST",
    url: `${p}/decline`,
    body: { proof: secret.proof, ...version },
    response: { outcome: "declined", status: "declined", version: 3 },
    call: (o, s) => recipientApi.decline(o, secret, 2, s),
  },
  {
    name: "nominate",
    method: "POST",
    url: `${orgBase}/ownership-nominations`,
    body: { membershipId: ids.membership },
    response: f.nomination,
    status: 201,
    call: (o, s) => api.nominate(o, ids.organization, ids.membership, s),
  },
  {
    name: "nominations",
    method: "GET",
    url: `${orgBase}/ownership-nominations`,
    response: paged([f.nomination]),
    params: { status: "pending", limit: "50" },
    call: (o, s) => api.nominations(o, ids.organization, {}, s),
  },
  {
    name: "my nominations",
    method: "GET",
    url: `${apiBase}/me/ownership-nominations`,
    response: paged([f.nomination]),
    params: { status: "pending", limit: "50" },
    call: (o, s) => api.myNominations(o, {}, s),
  },
  {
    name: "accept nomination",
    method: "POST",
    url: `${n}/accept`,
    body: version,
    response: { ...f.nomination, status: "accepted", canAccept: false },
    call: (o, s) =>
      api.acceptNomination(o, ids.organization, ids.nomination, version, s),
  },
  {
    name: "decline nomination",
    method: "POST",
    url: `${n}/decline`,
    body: version,
    response: { ...f.nomination, status: "declined", canAccept: false },
    call: (o, s) =>
      api.declineNomination(o, ids.organization, ids.nomination, version, s),
  },
  {
    name: "cancel nomination",
    method: "POST",
    url: `${n}/cancel`,
    body: optional,
    response: { ...f.nomination, status: "cancelled", canAccept: false },
    call: (o, s) =>
      api.cancelNomination(o, ids.organization, ids.nomination, optional, s),
  },
  {
    name: "audit",
    method: "GET",
    url: `${orgBase}/audit-events`,
    response: paged([f.audit]),
    params: {
      membershipId: ids.membership,
      limit: "50",
      from: "2026-11-05T00:00:00Z",
      to: "2026-11-06T00:00:00Z",
    },
    call: (o, s) =>
      api.audit(
        o,
        ids.organization,
        {
          membershipId: ids.membership,
          from: "2026-11-05T00:00:00Z",
          to: "2026-11-06T00:00:00Z",
        },
        s,
      ),
  },
];

describe("published Organization Gateway operations", () => {
  it.each(cases)(
    "$name uses its exact method, scope, body, and decoded shape",
    async (entry) => {
      const owner = establishOrganizationSession();
      let calls = 0;
      server.use(
        http.all(entry.url, async ({ request }) => {
          calls++;
          expect(request.method).toBe(entry.method);
          expect(request.headers.get("authorization")).toBe(
            "Bearer test.header.signature",
          );
          expect(request.headers.has("x-workspace-id")).toBe(false);
          if (entry.body) expect(await request.json()).toEqual(entry.body);
          else expect(await request.text()).toBe("");
          expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual(
            entry.params ?? {},
          );
          if (entry.name === "create")
            expect(request.headers.get("idempotency-key")).toBe(ids.attempt);
          return success(entry.response, entry.status);
        }),
      );
      await expect(
        entry.call(owner, new AbortController().signal),
      ).resolves.toEqual(entry.response);
      expect(calls).toBe(1);
    },
  );
  it.each([400, 401, 403, 404, 405, 409, 413, 429, 500, 502, 503, 504])(
    "preserves safe status %i and never retries an imperative write",
    async (status) => {
      const owner = establishOrganizationSession();
      let calls = 0;
      server.use(
        http.post(`${apiBase}/organizations`, () => {
          calls++;
          return failure(status, "Organization.Test", "2");
        }),
      );
      const error: unknown = await api
        .create(owner, { name: "Cedar", attemptId: ids.attempt })
        .catch((value: unknown) => value);
      expect(error).toMatchObject(
        status === 401
          ? { kind: "cancelled" }
          : {
              details: {
                status,
                code: "Organization.Test",
                retryAfterMs: 2000,
              },
            },
      );
      expect(JSON.stringify(error)).not.toMatch(
        /private server detail|test.header.signature/,
      );
      expect(calls).toBe(1);
    },
  );
  it("rejects a result retired by a newer account session", async () => {
    const owner = establishOrganizationSession();
    server.use(
      http.get(`${orgBase}/members/me`, async () => {
        await delay(40);
        return success(f.member);
      }),
    );
    const result = api
      .me(owner, ids.organization)
      .catch((error: unknown) => error);
    establishOrganizationSession(ids.otherUser);
    await expect(result).resolves.toMatchObject({ kind: "cancelled" });
    expect(authSession.getSnapshot()).toMatchObject({ userId: ids.otherUser });
  });
  it("cancels an owned read without retaining its response", async () => {
    const owner = establishOrganizationSession();
    const controller = new AbortController();
    server.use(
      http.get(`${orgBase}/members/me`, async () => {
        await delay(60);
        return success(f.member);
      }),
    );
    const result = api.me(owner, ids.organization, controller.signal);
    controller.abort();
    await expect(result).rejects.toMatchObject({ kind: "cancelled" });
  });
});
