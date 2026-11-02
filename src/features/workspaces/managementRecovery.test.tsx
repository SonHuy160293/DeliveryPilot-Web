import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";
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
  failure,
  paged,
  success,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";

beforeEach(() => {
  establishOrganizationSession();
  server.use(...organizationReadHandlers);
});
describe("versioned management and recovery", () => {
  it("confirms Owner nomination acceptance without performing an automatic demotion", async () => {
    let accepted = false;
    let demotions = 0;
    server.use(
      http.get(`${apiBase}/me/ownership-nominations`, () =>
        success(
          paged([
            {
              ...f.nomination,
              status: accepted ? "accepted" : "pending",
              canAccept: !accepted,
            },
          ]),
        ),
      ),
      http.post(
        `${orgBase}/ownership-nominations/${ids.nomination}/accept`,
        async ({ request }) => {
          expect(await request.json()).toEqual({ expectedVersion: 2 });
          accepted = true;
          return success({
            ...f.nomination,
            status: "accepted",
            version: 3,
            canAccept: false,
          });
        },
      ),
      http.post(`${orgBase}/members/${ids.membership}/demote-owner`, () => {
        demotions++;
        return success(f.removal);
      }),
    );
    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Accept Owner nomination" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Accept Owner nomination",
      }),
    );
    await waitFor(() => {
      expect(accepted).toBe(true);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(demotions).toBe(0);
    expect(
      screen.getByText(/does not transfer ownership automatically/),
    ).toBeVisible();
  });
  it("preserves the last Owner after a server continuity conflict", async () => {
    let calls = 0;
    server.use(
      http.post(
        `${orgBase}/members/${ids.membership}/demote-owner`,
        async ({ request }) => {
          calls++;
          expect(await request.json()).toEqual({
            expectedMembershipVersion: 1,
            reason: "Explicit step down",
          });
          return failure(409, "Organization.OwnerContinuityRequired");
        },
      ),
    );
    renderOrganizationRoute(workspaceOverviewPath(ids.organization));
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Manage my membership" }),
    );
    await user.click(screen.getByRole("button", { name: "Demote Owner" }));
    await user.type(screen.getByLabelText("Reason"), "Explicit step down");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Demote Owner",
      }),
    );
    expect(
      (await screen.findAllByText(/Another eligible Owner must remain/)).length,
    ).toBeGreaterThan(0);
    expect(calls).toBe(1);
    expect(screen.getByRole("dialog")).toBeVisible();
  });
  it("maps only known server field errors and focuses the rejected input", async () => {
    server.use(
      http.post(
        `${apiBase}/organizations`,
        () =>
          new Response(
            JSON.stringify({
              success: false,
              data: null,
              error: {
                code: "Validation.Failure",
                message: "private",
                errors: {
                  Name: ["private validation value"],
                  "A message key": ["unrelated detail"],
                },
                traceId: null,
              },
            }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          ),
      ),
    );
    renderOrganizationRoute(ROUTES.workspaces);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Create workspace" }));
    await user.type(screen.getByLabelText("Workspace name"), "Cedar");
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Create workspace",
      }),
    );
    expect(
      await screen.findByText(/The server rejected this value/),
    ).toBeVisible();
    expect(screen.getByLabelText("Workspace name")).toHaveFocus();
    expect(
      screen.queryByText(/private validation value|unrelated detail/),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: "Edit details and start a new attempt",
      }),
    );
    expect(screen.getByLabelText("Workspace name")).toHaveValue("Cedar");
    expect(screen.getByLabelText("Workspace name")).not.toHaveAttribute(
      "readonly",
    );
  });
  it("honors the issuance Retry-After countdown without automatically repeating a write", async () => {
    let calls = 0;
    server.use(
      http.post(`${orgBase}/invitations`, () => {
        calls++;
        return failure(429, "Invitation.RateLimited", "1");
      }),
    );
    renderOrganizationRoute(workspaceOverviewPath(ids.organization));
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
    expect(await screen.findByText(/Wait 1 seconds/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Issue invitation" }),
    ).toBeDisabled();
    expect(calls).toBe(1);
    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: "Issue invitation" }),
        ).toBeEnabled();
      },
      { timeout: 2000 },
    );
    expect(calls).toBe(1);
  });
  it("uses fresh ordinary-role grants after a removed membership rejoins", async () => {
    const { client } = renderOrganizationRoute(
      workspaceOverviewPath(ids.organization),
    );
    expect(await screen.findByText("Owner")).toBeVisible();
    server.use(
      http.get(`${orgBase}/members/me`, () =>
        success({ ...f.member, roles: f.acceptance.roles, version: 5 }),
      ),
    );
    await act(async () => {
      await client.invalidateQueries({
        queryKey: [
          "account",
          ids.user,
          "workspace",
          ids.organization,
          "membership",
        ],
      });
    });
    expect(await screen.findByText("Reviewer")).toBeVisible();
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
  });
});
