import { http, HttpResponse } from "msw";
import {
  organizationFixtures as f,
  organizationIds as ids,
} from "@/mocks/workspaces";
import { authSession } from "@/lib/api/authSession";
import { ownerFor } from "@/features/workspaces/api/request";

export const apiBase = `${window.location.origin}/identity/api/v1`;
export const orgBase = `${apiBase}/organizations/${ids.organization}`;
export const success = (data: unknown, status = 200) =>
  HttpResponse.json({ success: true, data, error: null }, { status });
export const failure = (status: number, code: string, retryAfter?: string) =>
  HttpResponse.json(
    {
      success: false,
      data: null,
      error: {
        code,
        message: "private server detail",
        errors: null,
        traceId: "support-123",
      },
    },
    { status, headers: retryAfter ? { "Retry-After": retryAfter } : undefined },
  );
export const paged = (
  items: readonly unknown[],
  nextCursor: string | null = null,
) => ({ items, nextCursor });
export function establishOrganizationSession(accountId: string = ids.user) {
  authSession.establish(
    {
      userId: accountId,
      accessToken: "test.header.signature",
      expiresAt: Date.now() + 600_000,
    },
    authSession.begin(),
  );
  return ownerFor(accountId);
}
export const organizationReadHandlers = [
  http.get(`${apiBase}/me/organizations`, () => success(paged([f.workspace]))),
  http.get(`${orgBase}/members/me`, () => success(f.member)),
  http.get(`${orgBase}/members`, () => success(paged([f.otherMember]))),
  http.get(`${orgBase}/members/:membershipId`, ({ params }) =>
    success(params.membershipId === ids.membership ? f.member : f.otherMember),
  ),
  http.get(`${orgBase}/roles`, () => success(paged([f.role]))),
  http.get(`${orgBase}/permissions`, () =>
    success({
      codes: ["organization.members.read", "organization.roles.manage"],
    }),
  ),
  http.get(`${orgBase}/invitations`, () => success(paged([f.invitation]))),
  http.get(`${orgBase}/invitations/:invitationId`, () => success(f.invitation)),
  http.get(`${orgBase}/ownership-nominations`, () =>
    success(paged([f.nomination])),
  ),
  http.get(`${apiBase}/me/ownership-nominations`, () =>
    success(paged([f.nomination])),
  ),
  http.get(`${orgBase}/audit-events`, () => success(paged([f.audit]))),
];
