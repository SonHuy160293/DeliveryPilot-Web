import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
import { authSession } from "@/lib/api/authSession";
import { ROUTES, workspaceOverviewPath } from "@/lib/routes";
import {
  organizationFixtures as f,
  organizationIds as ids,
} from "@/mocks/workspaces";
import { server } from "@/test/mocks/server";
import {
  apiBase,
  orgBase,
  establishOrganizationSession,
  organizationReadHandlers,
  success,
  failure,
  paged,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";

beforeEach(() => {
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
});
const overview = () => workspaceOverviewPath(ids.organization);
describe("real workspace routes", () => {
  it("shows a recoverable discovery continuation failure instead of indefinite admission loading", async () => {
    server.use(
      http.get(`${apiBase}/me/organizations`, ({ request }) =>
        new URL(request.url).searchParams.has("cursor")
          ? failure(503, "Organization.AuthorityUnavailable")
          : success(paged([], "next")),
      ),
    );
    renderOrganizationRoute(overview());
    expect(
      await screen.findByText(/The request could not be completed/),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeVisible();
    expect(
      screen.queryByRole("tab", { name: "Members" }),
    ).not.toBeInTheDocument();
  });
  it("follows discovery cursors and never shows fixture counters or preview overrides", async () => {
    const cursors: (string | null)[] = [];
    server.use(
      http.get(`${apiBase}/me/organizations`, ({ request }) => {
        const cursor = new URL(request.url).searchParams.get("cursor");
        cursors.push(cursor);
        return success(
          cursor
            ? paged([
                {
                  ...f.workspace,
                  organizationId: ids.otherOrganization,
                  name: "Second workspace",
                },
              ])
            : paged([f.workspace], "opaque-page-two"),
        );
      }),
    );
    renderOrganizationRoute(`${ROUTES.workspaces}?state=error`);
    expect(
      await screen.findByRole("heading", { name: f.workspace.name }),
    ).toBeVisible();
    expect(screen.queryByText("Last activity")).not.toBeInTheDocument();
    await userEvent.type(
      screen.getByLabelText("Filter loaded workspaces"),
      "Second",
    );
    expect(screen.getByText(/No matching loaded workspaces/)).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(await screen.findByText("Second workspace")).toBeVisible();
    expect(cursors).toEqual([null, "opaque-page-two"]);
  });
  it("opens the workspace picker and filters loaded results", async () => {
    renderOrganizationRoute(overview());
    const user = userEvent.setup();
    await screen.findByRole("heading", { name: f.workspace.name });
    await user.click(screen.getByRole("button", { name: /switch workspace/i }));
    const dialog = screen.getByRole("dialog", { name: "Switch workspace" });
    expect(
      within(dialog).getByRole("link", { name: f.workspace.name }),
    ).toBeVisible();
    await user.type(
      within(dialog).getByLabelText("Filter loaded workspaces"),
      "no match",
    );
    expect(
      within(dialog).getByText("No matching loaded workspaces."),
    ).toBeVisible();
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("button", { name: /switch workspace/i }),
    ).toHaveFocus();
  });
  it("withholds panels during fresh admission and resolves names beyond the first discovery page", async () => {
    server.use(
      http.get(`${orgBase}/members/me`, async () => {
        await delay(80);
        return success(f.member);
      }),
      http.get(`${apiBase}/me/organizations`, ({ request }) =>
        success(
          new URL(request.url).searchParams.has("cursor")
            ? paged([f.workspace])
            : paged([], "next"),
        ),
      ),
    );
    renderOrganizationRoute(overview());
    expect(
      screen.queryByRole("tab", { name: "Members" }),
    ).not.toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: f.workspace.name }),
    ).toBeVisible();
    expect(await screen.findByRole("tab", { name: "Audit" })).toBeVisible();
  });
  it("rejects a slug without making a workspace request", () => {
    let calls = 0;
    server.use(
      http.get(`${orgBase}/members/me`, () => {
        calls++;
        return success(f.member);
      }),
    );
    renderOrganizationRoute("/w/a-name-is-not-authority");
    expect(
      screen.getByText(/does not contain a valid workspace identifier/),
    ).toBeVisible();
    expect(calls).toBe(0);
  });
  it("returns denied own membership to selection while retaining the valid identity", async () => {
    server.use(
      http.get(`${orgBase}/members/me`, () =>
        failure(403, "Organization.AccessDenied"),
      ),
    );
    const { client } = renderOrganizationRoute(overview());
    expect(
      await screen.findByRole("heading", { name: "Workspaces" }),
    ).toBeVisible();
    expect(authSession.getSnapshot().status).toBe("authenticated");
    expect(
      client.getQueryCache().findAll({
        queryKey: ["account", ids.user, "workspace", ids.organization],
      }),
    ).toHaveLength(0);
  });
  it("keeps member-read denial separate from workspace membership and role catalog reads", async () => {
    server.use(
      http.get(`${orgBase}/members`, () =>
        failure(403, "Organization.AccessDenied"),
      ),
    );
    renderOrganizationRoute(overview());
    await userEvent.click(await screen.findByRole("tab", { name: "Members" }));
    expect(
      await screen.findByText(/Access to this operation is unavailable/),
    ).toBeVisible();
    expect(
      screen.queryByText(f.otherMember.displayName),
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "Roles" }));
    await userEvent.click(
      await screen.findByRole("button", { name: "Create role" }),
    );
    expect(
      await screen.findByRole("heading", { name: "Create a custom role" }),
    ).toBeVisible();
    expect(authSession.getSnapshot().status).toBe("authenticated");
  });
  it("preserves full role metadata and retained permissions when renaming", async () => {
    let current = {
      ...f.role,
      name: "Reviewer",
      description: "Retained description",
      version: 2,
    };
    server.use(
      http.get(`${orgBase}/roles`, () => success(paged([current]))),
      http.get(`${orgBase}/permissions`, () =>
        success({ codes: ["organization.roles.manage"] }),
      ),
      http.put(`${orgBase}/roles/${ids.role}`, async ({ request }) => {
        expect(await request.json()).toEqual({
          name: "Renamed reviewer",
          description: "Retained description",
          permissionCodes: ["organization.members.read"],
          expectedVersion: 2,
        });
        current = { ...current, name: "Renamed reviewer", version: 4 };
        return success(current);
      }),
    );
    renderOrganizationRoute(overview());
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: "Roles" }));
    await user.click(
      await screen.findByRole("button", { name: "Edit Reviewer" }),
    );
    await user.clear(screen.getByLabelText("Role name"));
    await user.type(screen.getByLabelText("Role name"), "Renamed reviewer");
    await user.click(screen.getByRole("button", { name: "Save role" }));
    expect(
      await screen.findByRole("button", { name: "Edit Renamed reviewer" }),
    ).toBeVisible();
  });
  it("keeps a role draft across section changes and requires review after a revision change", async () => {
    let current = { ...f.role, name: "Reviewer", version: 2 };
    server.use(http.get(`${orgBase}/roles`, () => success(paged([current]))));
    const { client } = renderOrganizationRoute(overview());
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: "Roles" }));
    await user.click(
      await screen.findByRole("button", { name: "Edit Reviewer" }),
    );
    await user.clear(screen.getByLabelText("Role name"));
    await user.type(screen.getByLabelText("Role name"), "Draft reviewer");
    await user.click(screen.getByRole("tab", { name: "Overview" }));
    await user.click(screen.getByRole("tab", { name: "Roles" }));
    expect(screen.getByLabelText("Role name")).toHaveValue("Draft reviewer");
    current = { ...current, version: 3, name: "Updated reviewer" };
    await act(async () => {
      await client.invalidateQueries({
        queryKey: ["account", ids.user, "workspace", ids.organization, "roles"],
      });
    });
    expect(
      await screen.findByText(/This role changed while you were editing/),
    ).toBeVisible();
    expect(screen.getByLabelText("Role name")).toHaveValue("Draft reviewer");
    expect(screen.getByRole("button", { name: "Save role" })).toBeDisabled();
    await user.click(
      screen.getByRole("button", { name: "Discard draft and reload role" }),
    );
    expect(screen.getByLabelText("Role name")).toHaveValue("Updated reviewer");
  });
  it("uses the current target version and distinguishes already-revoked role from a new change", async () => {
    let calls = 0;
    server.use(
      http.post(
        `${orgBase}/members/${ids.otherMembership}/roles/${ids.memberRole}/revoke`,
        async ({ request }) => {
          calls++;
          expect(await request.json()).toEqual({
            expectedMembershipVersion: 2,
            reason: null,
          });
          return success({
            ...f.assignment,
            membershipId: ids.otherMembership,
            changed: false,
          });
        },
      ),
    );
    renderOrganizationRoute(overview());
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: "Members" }));
    await user.click(
      await screen.findByRole("button", { name: "View Morgan Example" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Revoke Member" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Revoke Member",
      }),
    );
    expect(
      await screen.findByText(/already in the requested state/),
    ).toBeVisible();
    expect(calls).toBe(1);
  });
  it("keeps issuance available for an action-only caller and displays returned delivery without claiming membership", async () => {
    server.use(
      http.get(`${orgBase}/invitations`, () =>
        failure(403, "Organization.AccessDenied"),
      ),
      http.post(`${orgBase}/invitations`, async ({ request }) => {
        expect(await request.json()).toEqual({
          recipientEmail: "new@example.test",
          roleIds: [ids.role],
        });
        return success(f.invitation, 201);
      }),
    );
    renderOrganizationRoute(overview());
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: "Invitations" }));
    await user.click(
      await screen.findByRole("button", { name: "Invite member" }),
    );
    await user.type(
      await screen.findByLabelText("Recipient email"),
      "new@example.test",
    );
    await user.click(await screen.findByRole("checkbox", { name: "Reviewer" }));
    await user.click(screen.getByRole("button", { name: "Issue invitation" }));
    expect(await screen.findByText("Delivery: queued")).toBeVisible();
    expect(screen.getByText(/Membership has not been granted/)).toBeVisible();
  });
  it("erases retained audit events when continuation loses permission", async () => {
    server.use(
      http.get(`${orgBase}/audit-events`, ({ request }) =>
        new URL(request.url).searchParams.has("cursor")
          ? failure(403, "Organization.AccessDenied")
          : success(
              paged([{ ...f.audit, reason: "Private audit reason" }], "next"),
            ),
      ),
    );
    const { client } = renderOrganizationRoute(overview());
    const user = userEvent.setup();
    await user.click(await screen.findByRole("tab", { name: "Audit" }));
    expect(
      await screen.findByText("Reason: Private audit reason"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Load more" }));
    expect(
      await screen.findByText(/Access to this operation is unavailable/),
    ).toBeVisible();
    expect(screen.queryByText(/Private audit reason/)).not.toBeInTheDocument();
    await waitFor(() => {
      expect(
        JSON.stringify(
          client
            .getQueryCache()
            .findAll({
              queryKey: [
                "account",
                ids.user,
                "workspace",
                ids.organization,
                "audit",
              ],
            })
            .map((query) => query.state.data),
        ),
      ).not.toContain("Private audit reason");
    });
    expect(
      screen.getByRole("heading", { name: f.workspace.name }),
    ).toBeVisible();
  });
  it("does not publish a delayed creation after sign-out", async () => {
    let finish: (() => void) | undefined;
    server.use(
      http.post(`${apiBase}/organizations`, async () => {
        await new Promise<void>((resolve) => {
          finish = resolve;
        });
        return success(f.creation, 201);
      }),
    );
    const { client } = renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
    await user.type(screen.getByLabelText("Workspace name"), "Cedar delivery");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create workspace",
      }),
    );
    await waitFor(() => {
      expect(finish).toBeDefined();
    });
    await user.click(screen.getByRole("button", { name: "Close creation" }));
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    await act(async () => {
      finish?.();
      await Promise.resolve();
    });
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    expect(
      screen.queryByText(/creation was confirmed/),
    ).not.toBeInTheDocument();
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });
});
