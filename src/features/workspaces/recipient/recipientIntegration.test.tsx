import { StrictMode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { delay, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { AppRoutes } from "@/app/router";
import { createQueryClient } from "@/lib/query/queryClient";
import { authSession } from "@/lib/api/authSession";
import { ROUTES } from "@/lib/routes";
import {
  organizationFixtures as f,
  organizationIds as ids,
} from "@/mocks/workspaces";
import {
  createInvitationFlow,
  parseInvitationFragment,
  captureInvitationFragment,
} from "@/features/workspaces/recipient/invitationFlow";
import { server } from "@/test/mocks/server";
import {
  apiBase,
  orgBase,
  establishOrganizationSession,
  organizationReadHandlers,
  failure,
  success,
} from "@/test/fixtures/organizationApi";
import { renderOrganizationRoute } from "@/test/renderOrganizationRoute";

const secret = { invitationId: ids.invitation, proof: "b".repeat(43) };
const recipient = `${apiBase}/organization-invitations/${ids.invitation}`;
function Path() {
  const location = useLocation();
  return (
    <output data-testid="path">
      {location.pathname}
      {location.hash}
    </output>
  );
}
function expectNoProof(client: ReturnType<typeof createQueryClient>) {
  expect(
    JSON.stringify(
      client
        .getQueryCache()
        .getAll()
        .map((query) => ({ key: query.queryKey, state: query.state })),
    ),
  ).not.toContain(secret.proof);
  expect(
    JSON.stringify(
      client
        .getMutationCache()
        .getAll()
        .map((mutation) => mutation.state),
    ),
  ).not.toContain(secret.proof);
  expect(JSON.stringify(localStorage)).not.toContain(secret.proof);
  expect(JSON.stringify(sessionStorage)).not.toContain(secret.proof);
}
describe("recipient secret flow", () => {
  it("does not use a retired continuation after the sign-in screen is already mounted", async () => {
    server.use(
      http.post(`${apiBase}/auth/login`, () =>
        success({
          userId: ids.user,
          accessToken: "test.header.signature",
          tokenType: "Bearer",
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        }),
      ),
    );
    const flow = createInvitationFlow(secret);
    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[ROUTES.joinWorkspace]}>
          <AppRoutes initialInvitation={flow} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const user = userEvent.setup();
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    flow.clear();
    await user.type(screen.getByLabelText("Email"), "recipient@example.test");
    await user.type(screen.getByLabelText("Password"), "fictional-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByRole("heading", { name: "Workspaces" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Preview invitation" }),
    ).not.toBeInTheDocument();
  });
  it("retires invitation proof on registration and requires reopening the email after account creation", async () => {
    server.use(
      http.post(`${apiBase}/auth/register`, () =>
        success({ userId: ids.user }, 201),
      ),
    );
    const flow = createInvitationFlow(secret);
    const client = createQueryClient();
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[ROUTES.joinWorkspace]}>
          <AppRoutes initialInvitation={flow} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole("link", { name: "Register" }));
    await waitFor(() => {
      expect(flow.get()).toBeUndefined();
    });
    await user.type(screen.getByLabelText("Display name"), "New recipient");
    await user.type(screen.getByLabelText("Email"), "recipient@example.test");
    await user.type(screen.getByLabelText("Password"), "fictional-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      "reopen the original invitation email",
    );
    expect(authSession.getSnapshot().status).toBe("anonymous");
    expectNoProof(client);
    expect(client.getMutationCache().getAll()).toHaveLength(0);
  });
  it("scrubs the real incoming fragment and rejects duplicate or malformed secrets", () => {
    const previous = window.location.pathname;
    window.history.replaceState(
      {},
      "",
      `${ROUTES.joinWorkspace}#invitationId=${ids.invitation}&proof=${secret.proof}`,
    );
    expect(captureInvitationFragment()).toEqual(secret);
    expect(window.location.hash).toBe("");
    expect(
      parseInvitationFragment(
        `#invitationId=${ids.invitation}&proof=${secret.proof}&proof=${secret.proof}`,
      ),
    ).toBeUndefined();
    expect(parseInvitationFragment("#proof=short")).toBeUndefined();
    window.history.replaceState({}, "", previous);
  });
  it("survives StrictMode and same-tab sign-in, using no secret navigation state or caches", async () => {
    server.use(
      http.post(`${apiBase}/auth/login`, () =>
        success({
          userId: ids.user,
          accessToken: "test.header.signature",
          tokenType: "Bearer",
          expiresAt: new Date(Date.now() + 600_000).toISOString(),
        }),
      ),
      http.post(`${recipient}/preview`, async ({ request }) => {
        expect(await request.json()).toEqual({ proof: secret.proof });
        return success(f.preview);
      }),
    );
    const client = createQueryClient();
    client.setDefaultOptions({ queries: { retry: false } });
    render(
      <StrictMode>
        <QueryClientProvider client={client}>
          <MemoryRouter
            initialEntries={[
              `${ROUTES.joinWorkspace}#invitationId=${ids.invitation}&proof=${secret.proof}`,
            ]}
          >
            <Path />
            <AppRoutes />
          </MemoryRouter>
        </QueryClientProvider>
      </StrictMode>,
    );
    const user = userEvent.setup();
    expect(
      await screen.findByRole("heading", { name: "Sign in" }),
    ).toBeVisible();
    expect(screen.getByTestId("path")).not.toHaveTextContent(secret.proof);
    await user.type(screen.getByLabelText("Email"), "recipient@example.test");
    await user.type(screen.getByLabelText("Password"), "fictional-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    await user.click(
      await screen.findByRole("button", { name: "Preview invitation" }),
    );
    expect(await screen.findByText("Frozen Reviewer")).toBeVisible();
    expectNoProof(client);
  });
  it("previews for a zero-membership account and permits decline when acceptance requires reissue", async () => {
    establishOrganizationSession();
    server.use(
      http.post(`${recipient}/preview`, () =>
        success({
          ...f.preview,
          canAccept: false,
          requiresReissue: true,
        }),
      ),
      http.post(`${recipient}/decline`, async ({ request }) => {
        expect(await request.json()).toEqual({
          proof: secret.proof,
          expectedVersion: 2,
        });
        return success({
          outcome: "declined",
          status: "declined",
          version: 3,
        });
      }),
    );
    const { client } = renderOrganizationRoute(ROUTES.joinWorkspace, secret);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Preview invitation" }),
    );
    expect(
      await screen.findByRole("button", { name: "Accept invitation" }),
    ).toBeDisabled();
    expect(screen.getByText(/needs reissue/)).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Decline invitation" }),
    );
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Decline invitation",
      }),
    );
    expect(
      await screen.findByText(/Invitation declined. No membership was created/),
    ).toBeVisible();
    expect(client.getMutationCache().getAll()).toHaveLength(0);
    expectNoProof(client);
  });
  it("retains same-proof acceptance recovery and enters only after current membership checks", async () => {
    establishOrganizationSession();
    server.use(...organizationReadHandlers);
    let accepts = 0;
    let selfReads = 0;
    server.use(
      http.post(`${recipient}/preview`, () => success(f.preview)),
      http.post(`${recipient}/accept`, async ({ request }) => {
        accepts++;
        expect(await request.json()).toEqual({
          proof: secret.proof,
          expectedVersion: 2,
        });
        return accepts === 1
          ? success({ malformed: true })
          : success({ ...f.acceptance, outcome: "alreadyAccepted" });
      }),
      http.get(`${orgBase}/members/me`, () => {
        selfReads++;
        return success({
          ...f.member,
          roles: f.acceptance.roles,
          version: 3,
        });
      }),
    );
    const { client } = renderOrganizationRoute(ROUTES.joinWorkspace, secret);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Preview invitation" }),
    );
    await user.click(
      await screen.findByRole("button", { name: "Accept invitation" }),
    );
    expect(await screen.findByText(/The outcome is unknown/)).toBeVisible();
    expect(accepts).toBe(1);
    await user.click(
      screen.getByRole("button", {
        name: "Retry acceptance with same proof",
      }),
    );
    expect(
      await screen.findByRole("heading", { name: f.workspace.name }),
    ).toBeVisible();
    expect(selfReads).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Reviewer")).toBeVisible();
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    expectNoProof(client);
  });
  it("clears an unavailable proof without disclosing recipient information", async () => {
    establishOrganizationSession();
    server.use(
      http.post(`${recipient}/preview`, () =>
        failure(403, "Invitation.Unavailable"),
      ),
    );
    const { client } = renderOrganizationRoute(ROUTES.joinWorkspace, secret);
    await userEvent.click(
      await screen.findByRole("button", { name: "Preview invitation" }),
    );
    expect(
      await screen.findByText(/Reopen the original invitation email/),
    ).toBeVisible();
    expect(screen.queryByText("Frozen Reviewer")).not.toBeInTheDocument();
    expect(authSession.getSnapshot().status).toBe("authenticated");
    expectNoProof(client);
  });
  it("discards a proof and late preview on account change", async () => {
    establishOrganizationSession();
    let started = false;
    server.use(
      http.post(`${recipient}/preview`, async () => {
        started = true;
        await delay(60);
        return success(f.preview);
      }),
    );
    const { client } = renderOrganizationRoute(ROUTES.joinWorkspace, secret);
    await userEvent.click(
      await screen.findByRole("button", { name: "Preview invitation" }),
    );
    await waitFor(() => {
      expect(started).toBe(true);
    });
    act(() => {
      establishOrganizationSession(ids.otherUser);
    });
    expect(
      await screen.findByText(/Reopen the original invitation email/),
    ).toBeVisible();
    expect(screen.queryByText("Frozen Reviewer")).not.toBeInTheDocument();
    expectNoProof(client);
  });
  it("clears the owned flow on abandonment, completion, and subject retirement", () => {
    const owner = establishOrganizationSession();
    const flow = createInvitationFlow(secret);
    expect(flow.bind(owner)).toEqual(secret);
    establishOrganizationSession(ids.otherUser);
    flow.retire();
    expect(flow.get()).toBeUndefined();
    const fresh = createInvitationFlow(secret);
    fresh.clear();
    expect(fresh.get()).toBeUndefined();
  });
  it("requires reopening the email after reload and never invents terminal preview lookup", async () => {
    establishOrganizationSession();
    const calls = vi.fn();
    server.use(
      http.post(`${recipient}/preview`, () => {
        calls();
        return success(f.preview);
      }),
    );
    renderOrganizationRoute(ROUTES.joinWorkspace);
    expect(
      await screen.findByText(/Reopen the original invitation email/),
    ).toBeVisible();
    expect(calls).not.toHaveBeenCalled();
  });
});
